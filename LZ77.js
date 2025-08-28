//RFC 1951
//const NMChunks = PNG();

//start since the headers of the deflate blocks
let code = "";

function LZ77()
{
 function CSTE(Code, ExtraBits=0, Min=0, Max=Min)//create table element
 {
  return {
    Code: Code,
    ExtraBits: ExtraBits,
    Min: Min,
    Max: Max
  };
 };
 
 const LengthCodesTable = Object.freeze([
  CSTE(257,0,3), CSTE(258,0,4), CSTE(259,0,5), CSTE(260,0,6),
  CSTE(261,0,7), CSTE(262,0,8), CSTE(263,0,9), CSTE(264,0,10),
  CSTE(265,1,11,12), CSTE(266,1,13,14), CSTE(267,1,15,16), CSTE(268,1,17,18),
  CSTE(269,2,19,22), CSTE(270,2,23,26), CSTE(271,2,27,30), CSTE(272,2,31,34),
  CSTE(273,3,35,42), CSTE(274,3,43,50), CSTE(275,3,51,58), CSTE(276,3,59,66),
  CSTE(277,4,67,82), CSTE(278,4,83,98), CSTE(279,4,99,114), CSTE(280,4,115,130),
  CSTE(281,5,131,162), CSTE(282,5,163,194), CSTE(283,5,195,226), 
  CSTE(284,5,227,257), CSTE(285,0,258),
 ]); 
 const DistancesCodesTable = Object.freeze([
  CSTE(0,0,1), CSTE(1,0,2), 
  CSTE(2,0,3), CSTE(3,0,4),
  CSTE(4,1,5,6), CSTE(5,1,7,8), 
  CSTE(6,2,9,12), CSTE(7,2,13,16),
  CSTE(8,3,17,24), CSTE(9,3,25,32), 
  CSTE(10,4,33,48), CSTE(11,4,49,64),
  CSTE(12,5,65,96), CSTE(13,5,97,128), 
  CSTE(14,6,129,192), CSTE(15,6,193,256),
  CSTE(16,7,257,384), CSTE(17,7,385,512), 
  CSTE(18,8,513,768), CSTE(19,8,769,1024),
  CSTE(20,9,1025,1536), CSTE(21,9,1537,2028), 
  CSTE(22,10,2049,3072), CSTE(23,10,3073,4096),
  CSTE(24,11,4097,6144), CSTE(25,11,6145,8192), 
  CSTE(26,12,8193,12288), CSTE(27,12,12289,16384), 
  CSTE(28,13,16385,24576), CSTE(29,13,24577,32768),
 ]); //for fixed huffman

 const NMChunks = Chunks();

 const EOB = 256;//End of (deflate) block
 
 const ZLIB_FLAG_BITMASKS = Object.freeze({
  CompressionMethod: 0b00001111,
  CompressionInfo: 0b11110000,
 
  FCheck: 0b00001111,
  FDICT: 0b00010000,
  FLEVEL: 0b11000000
 });
 
 const DEFLATE_BLOCK_TYPES = Object.freeze({
  NO_COMPRESSION: 0b00,
  FIXED_HUFFMAN_CODES: 0b01,
  DYNAMIC_HUFFMAN_CODES: 0b10,
  RESERVED: 0b11
 });
 
const RETURN_VALUES = Object.freeze({
 ERROR: -1,
 BLOCK_CONTINUE: 0,
 BLOCK_LAST: 1
});
 
 let NULL_VECTOR8 = new Vector8(0);
 
 let NULL_BASIC_CHUNK = NMChunks._createBasicChunk();
 let NULL_READING_CONTEXT = NMChunks._createReadingContext();
 let NULL_NCDS_READING_CONTEXT = NMChunks._createMultiChunkReadingContext();
 
 let NULL_BIT_READING_CONTEXT = _createBitReadingContext();
 let NULL_DELFATE_BLOCK = _createDeflateBlockContext();
 let NULL_DECOMPRESSION_CONTEXT = _createDecompressionContext();
 
 let NCDSReadByte = NMChunks.NCDSReadByte;
 let NCDSReadCurrentByte = NMChunks.NCDSReadCurrentByte;
 let NCDSReadNumber = NMChunks.NCDSReadNumber;
 
 let createMultiChunkReadingContext = NMChunks.createMultiChunkReadingContext;

 function _createDeflateBlockContext()
 {
  return {
   OutputData: new Vector8(0),
   BlockType: DEFLATE_BLOCK_TYPES.RESERVED,
   IsFinalBlock: 0
  };
 };
 
 function _createDecompressionContext()
 {
  return {
   BitReadingContext: NULL_BIT_READING_CONTEXT,
   DataOutput: NULL_VECTOR8,
 
   ADLER32ChS: 0,
   ADLER32: 0,
   ADLER32_SUM1: 0,
   ADLER32_SUM2: 0
  }; 
 };
 
 function createDecompressionContext(_BitReadingContext)
 {
  let BitReadingContext = NULL_BIT_READING_CONTEXT;
  BitReadingContext = _BitReadingContext;
 
  if (!BitReadingContext)
  {
   return NULL_DECOMPRESSION_CONTEXT;
  };
 
  let InflateDecompressionContext = _createDecompressionContext();

  InflateDecompressionContext.BitReadingContext = BitReadingContext;

  InflateDecompressionContext.ADLER32_SUM1 = 1;
  InflateDecompressionContext.ADLER32_SUM2 = 0;
   /* 
     Adler-32 is composed of two sums accumulated per byte: s1 is
     the sum of all bytes, s2 is the sum of all s1 values. Both sums
     are done modulo 65521. s1 is initialized to 1, s2 to zero.  The
     Adler-32 checksum is stored as s2*65536 + s1 in most-
     significant-byte first (network) order. 
  */
 
  return InflateDecompressionContext;
 };
 
 function _createBitReadingContext(){
  return {
   NCDS_ReadingContext : NULL_NCDS_READING_CONTEXT,
   CurrentBit: 0,
   CurrentByteValue: 0,
   CurrentByteIndex: 0 
  };
 };
 
 function createBitReadingContext(_NCDS_ReadingContext){
  let NCDS_ReadingContext = NULL_NCDS_READING_CONTEXT;
  NCDS_ReadingContext = _NCDS_ReadingContext;
  let BitReadingContext = _createBitReadingContext();
  
  BitReadingContext.NCDS_ReadingContext = NCDS_ReadingContext;
  BitReadingContext.CurrentByteValue = NCDSReadByte(NCDS_ReadingContext);
  
  BitReadingContext.CurrentBit = 0; 
  //CurrentBit >= 0 & CurrentBit <= 7
  
  return BitReadingContext;
 };
 
 function readBit(_BitReadingContext)
 {
  let BitReadingContext = NULL_BIT_READING_CONTEXT;
  BitReadingContext = _BitReadingContext;
 
  if (BitReadingContext.CurrentByteIndex != BitReadingContext.NCDS_ReadingContext.CurrentGlobalChunkIndex)
  {
   BitReadingContext.CurrentByteValue = NCDSReadCurrentByte(BitReadingContext.NCDS_ReadingContext);
   BitReadingContext.CurrentByteIndex = BitReadingContext.NCDS_ReadingContext.CurrentGlobalChunkIndex;
  };
  
  let BitValue = (BitReadingContext.CurrentByteValue >> BitReadingContext.CurrentBit) & 1;
  BitReadingContext.CurrentBit++;
  if (BitReadingContext.CurrentBit == 8)
  {
   BitReadingContext.CurrentBit = 0;
   BitReadingContext.CurrentByteValue = NCDSReadByte(BitReadingContext.NCDS_ReadingContext);
  };

  return BitValue;
 };
 
 function readBitsLSB(_BitReadingContext,BitCount=1)
 {
  let BitReadingContext = NULL_BIT_READING_CONTEXT;
  BitReadingContext = _BitReadingContext;
  let Value = 0;
 
  for (let Index = 0;Index < BitCount;Index++)
  {
   let Bit = readBit(BitReadingContext);//From LSB to the MSB
   Value += Bit * (2**Index);
  };
 
  return Value;
 };
 
 function readBitsMSB(_BitReadingContext,BitCount=1)
 {
  let BitReadingContext = NULL_BIT_READING_CONTEXT;
  BitReadingContext = _BitReadingContext;
  let Value = 0;
 
  for (let Index = 0;Index < BitCount;Index++)
  {
   let Bit = readBit(BitReadingContext);//From MSB to the LSB
   Value += Bit * (2**(BitCount-Index-1));
  };
 
  return Value;
 };

 function updateADLER32Val(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT;
  DecompressionContext = _DecompressionContext;
 };

 function ReadLiteralLengthSymbol(_DecompressionContext)
 {
  /* 
       Lit Value    Bits        Codes
       ---------    ----        -----
         0 - 143     8          00110000(48) through 10111111(191)
       144 - 255     9          110010000(400) through 111111111(511)
       256 - 279     7          0000000(0) through 0010111(23)
       280 - 287     8          11000000(192) through 11000111(199)  
  */
  //later can be optimized, because there are too many branches
  //bookmark update (perhaps not, because I still have to check tables couple of times, I'll see)
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT;
  DecompressionContext = _DecompressionContext;
  let BitReadingContext = DecompressionContext.BitReadingContext;
  let ThirdGroupBits = readBitsMSB(BitReadingContext,7);
  if (ThirdGroupBits >= 0 && ThirdGroupBits <= 23)
  {
   return ThirdGroupBits + 256;
  };
  let FirstAndFourthGroupBits = (ThirdGroupBits << 1) + readBit(BitReadingContext);
  if (FirstAndFourthGroupBits <= 191)
  {
   return FirstAndFourthGroupBits - 48;
  }
  else if(FirstAndFourthGroupBits <= 199)
  {
   return FirstAndFourthGroupBits + 88;
  };
  return ((FirstAndFourthGroupBits << 1) + readBit(BitReadingContext)) - 356;
 };
 
 function decodeBlockFixedHuffman(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT;
  DecompressionContext = _DecompressionContext;
  let BitReadingContext = DecompressionContext.BitReadingContext;
  let EndOfBlock = false;
  do 
  {
   let Lit = ReadLiteralLengthSymbol(DecompressionContext);
   if (Lit < 256)
   {
    let Success = DecompressionContext.DataOutput.insert(Lit);
    if (!Success)
    {
     console.assert(false,"Failed to insert a byte");
     break;
    };
    continue; 
   }
   else if(Lit == 256)
   {
    EndOfBlock = true;
    break;
   }
   else if (Lit > 285)
   {
    console.assert(false,"Lit shouldn't be greater than 285, because there's no such cases considered");
    break;
   };
   
  } while (!EndOfBlock);

  return EndOfBlock;
 };
 /*
  Data elements other than Huffman codes are packed
  starting with the least-significant bit of the data
  element.
 */
 function decodeBlockDynamicHuffman(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT;
  DecompressionContext = _DecompressionContext;
  let BitReadingContext = DecompressionContext.BitReadingContext;
  //bookmark unfinished
  /* 
   Decode the huffman code to retrieve tables 
   and then pass it to the huffman block decoder
  */
  let LengthCodesTable = [];
  let DistancesCodesTable = []; 
  //bookmark decode here instead
  /*code*/
  //stinky -> //return decodeBlockHuffman(DecompressionContext,DistancesCodesTable,LengthCodesTable);
 };

 function decodeBlockUncompressed(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT;
  DecompressionContext = _DecompressionContext;
  let BitReadingContext = DecompressionContext.BitReadingContext;

  let Len = readBitsLSB(BitReadingContext,2*8);
  let NLen = readBitsLSB(BitReadingContext,2*8);

  let IsValid = (Len ^ NLen) == 0xFFFF;

  if (!IsValid)
  {
   console.assert(
    false,
    "File corrupted"
   );
   return false;
  };

  for (let Index = 0;Index < Len;Index++)
  {
   let Byte = NCDSReadByte(BitReadingContext.NCDS_ReadingContext);
   //LE interpreted as BE Unsigned Integer
   //It should be done for all bytes

   //non-compressible blocks are limited to 65,535 bytes.
   if (Byte === null || Byte === undefined)
   {
    console.assert(false,
      "The read byte doesn't exist"
    );
    return false;
   };
   DecompressionContext.DataOutput.insert(Byte);
  };
  return true;
 };

 function decodeBlock(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT
  DecompressionContext = _DecompressionContext; 
  let BitReadingContext = DecompressionContext.BitReadingContext;
 
  let IsBlockFinal = readBit(BitReadingContext);
  let BlockType = readBitsMSB(BitReadingContext,2);
 
  let Success = false;

  if (BlockType == DEFLATE_BLOCK_TYPES.NO_COMPRESSION){
   Success = decodeBlockUncompressed(DecompressionContext);
  }
  else if(BlockType == DEFLATE_BLOCK_TYPES.FIXED_HUFFMAN_CODES){
   Success = decodeBlockFixedHuffman(DecompressionContext);
  } 
  else if(BlockType == DEFLATE_BLOCK_TYPES.DYNAMIC_HUFFMAN_CODES){
   Success = decodeBlockDynamicHuffman(DecompressionContext);
  } else {
   console.assert(false,
    "Incorrect block type"
   );
   return RETURN_VALUES.ERROR;
  };

  if (!Success)
  {
   return RETURN_VALUES.ERROR;
  };

  if (IsBlockFinal)
  {
   return RETURN_VALUES.BLOCK_LAST;
  };

  return RETURN_VALUES.BLOCK_CONTINUE;
 };
 
 function decodeBlocks(_DecompressionContext)
 {
  let DecompressionContext = NULL_DECOMPRESSION_CONTEXT
  DecompressionContext = _DecompressionContext; 
  while (true){
   let ResponseCode = decodeBlock(DecompressionContext);
   if (ResponseCode == RETURN_VALUES.BLOCK_CONTINUE)
   {
    continue;
   } else if (ResponseCode == RETURN_VALUES.ERROR)
   {
    console.assert(false,
      "Failed to decode data block"
    );
    return false; 
   } else {
    break;
   };
  };
  return true;
 };
 
 function inflateLZ77(_ReadingContext)
 {
  let ReadingContext = NULL_READING_CONTEXT;
  ReadingContext = _ReadingContext;  
  
  let NCDS_ZLIB_ReadingContext = createMultiChunkReadingContext(ReadingContext,"IDAT");
 
  let CMF = NCDSReadByte(NCDS_ZLIB_ReadingContext);
  let FLG = NCDSReadByte(NCDS_ZLIB_ReadingContext);
 
  let CompressionMethod = CMF & ZLIB_FLAG_BITMASKS.CompressionMethod;
  let CompressionInfo   = (CMF & ZLIB_FLAG_BITMASKS.CompressionInfo) >> 4;
 
  let FCHECK = FLG & ZLIB_FLAG_BITMASKS.FCheck;
  let FDICT  = (FLG & ZLIB_FLAG_BITMASKS.FDICT) >> 5;
  let FLEVEL = (FLG & ZLIB_FLAG_BITMASKS.FLEVEL) >> 6;
 
  let DICTID = 0;
 
  if (FDICT == 1) {
    DICTID = NCDSReadNumber(NCDS_ZLIB_ReadingContext);
  };
 
  let IsAMultipleOf31 = (CMF * 256 + FLG) % 31 == 0;
 
  if (!IsAMultipleOf31) {
     console.assert(false,
         "ZLIB data invalid, CMF*256 + FLG bytes must be a multiple of 31"
     );
     return null;
  };
 
  //bookmark revise
  let DataOutput = new Vector8(32000);
 
  let BitReadingContext = createBitReadingContext(NCDS_ZLIB_ReadingContext);
  let DecompressionContext = createDecompressionContext(BitReadingContext);
 
  DecompressionContext.DataOutput = DataOutput;

  decodeBlocks(DecompressionContext);
  let RealADLER32Chs = NCDSReadNumber(NCDS_ZLIB_ReadingContext);
 
  if (DecompressionContext.ADLER32ChS != RealADLER32Chs)
  {
   console.assert(false,
    "ADLER32 Checksum is invalid / data is invalid"
   );
   return null;
  };
 
  return DataOutput;
 };
 
 function deflateLZ77(_Data)
 {
  let Data = NULL_ARRAY;
  Data = _Data;
 
 };
 return {
  inflateLZ77: inflateLZ77,
  deflateLZ77: deflateLZ77,
 };
};