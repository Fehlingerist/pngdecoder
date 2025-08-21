const ZLIB_FLAG_BITMASKS = Object.freeze({
 CompressionMethod: 0b00001111,
 CompressionInfo: 0b11110000,

 FCheck: 0b00001111,
 FDICT: 0b00010000,
 FLEVEL: 0b11000000
});

const BIT_FLAGS = new Uint8Array([
  0b1,
  0b10,
  0b100,
  0b1000,
  0b10000,
  0b100000,
  0b1000000,
  0b10000000
]);

NULL_BASIC_CHUNK = _createBasicChunk();
NULL_READING_CONTEXT = _createReadingContext();
NULL_NCDS_READING_CONTEXT = _createMultiChunkReadingContext();

let NULL_ARRAY = new Uint8Array();
let NULL_BIT_READING_CONTEXT = _createBitReadingContext();

function _createBitReadingContext(){
 return {
  NCDS_ReadingContext : NULL_NCDS_READING_CONTEXT,
  CurrentBit: 0,
  CurrentByteValue: 0,
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

 let Flag = BIT_FLAGS[BitReadingContext.CurrentBit];
 let BitValue = (BitReadingContext.CurrentByteValue & Flag) >> BitReadingContext.CurrentBit;

 BitReadingContext.CurrentBit++;

 if (BitReadingContext.CurrentBit == 8)
 {
  BitReadingContext.CurrentBit = 0;
  BitReadingContext.CurrentByteValue = readByte(BitReadingContext.ByteReadingContext);
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

function inflateLZ77(_ReadingContext)
{
 let CodeHashmap = {};

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

 let IsAMultipleOf31 = (CMF * 256 + FLG) % 31 == 0;

 let ADLER32_SUM1 = 1;
 let ADLER32_SUM2 = 0;

 /* 
    Adler-32 is composed of two sums accumulated per byte: s1 is
    the sum of all bytes, s2 is the sum of all s1 values. Both sums
    are done modulo 65521. s1 is initialized to 1, s2 to zero.  The
    Adler-32 checksum is stored as s2*65536 + s1 in most-
    significant-byte first (network) order. 
 */
 ADLER32_SUM2 %= 65536;
 let ADLER32ChS = ADLER32_SUM2*65536 + ADLER32_SUM1;
 

 if (!IsAMultipleOf31) {
    console.assert(false,
        "ZLIB data invalid, CMF*256 + FLG bytes must be a multiple of 31"
       );
    return null;
 };
};

function deflateLZ77(_Data)
{
 let Data = NULL_ARRAY;
 Data = _Data;
};