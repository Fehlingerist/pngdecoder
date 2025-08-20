const PNG_SIGNATURE = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10]);
const ENUM_TARGET_TYPES = Object.freeze({
 URL: 0,
 FILE: 1,
});
const ENUM_CRITICAL_CHUNK_TYPES = Object.freeze({
 IHDR: true,
 PLTE: true,
 IDAT: true,
 IEND: true
});
const ENUM_LOGICAL_BIT_OFFSETS = Object.freeze({
    LOWER_CASE_BIT: 32,
});
const BIT_DEPTHS = Object.freeze({
 BIT1: 1,
 BIT2: 2,
 BIT4: 4,
 BIT8: 8,
 BIT16: 16,
});
const FILTER_METHODS = Object.freeze({
 None: 0,
 Sub: 1,
 Up: 2,
 Average: 3,
 Paeth: 4
});
const COLOR_TYPES = Object.freeze({
 PALETTE: 1,
 COLOR_USED: 2,
 ALPHA_CHANNEL: 4,
});
const COMPRESSION_METHODS = Object.freeze({
  LZ77: 0,
});

//TrueMaxValueForBitRange = NumberOfCombinations - 1 
let BYTE_MAX = Math.pow(2,8) - 1; 
let BIT32_MAX = Math.pow(2,32) - 1;

let TARGET_IMAGE_RESOURCE = "";
let TARGET_IMAGE_RESOURCE_TYPE = ENUM_TARGET_TYPES.URL;

const NULL_READING_CONTEXT = _createReadingContext();
const NULL_BASIC_CHUNK = _createBasicChunk();

function isURLValid(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  };
};

function _createColor(R=0,G=0,B=0)
{
 R &= BYTE_MAX;
 G &= BYTE_MAX;
 B &= BYTE_MAX;

 return {
  R: R,
  G: G,
  B: B
 };
};

function _createReadingContext()
{
 let ReadingContex = {
  Source: new Uint8Array(),
  Length: 0,
  
  Start: 0,//this is used for elements of the Source data block in the context of png file format
  End: 0,
  
  ReadBytes: 0,
  CurrentReadByte: 0,
  Chunks: {},
 };   
 return ReadingContex;
};

function _createBasicChunk()
{
  return {
    ChunkType: "",
    Data: new Uint8Array(),
    IsCriticial: false,
    IsPublic: false,
    ReservedBit: false,
    SafeToCopy: false,
    
    Length: 0,
  };
}

function createReadingContext(Data)
{
 if (!Data) {
   return NULL_READING_CONTEXT;
 };
 let ReadingContext = _createReadingContext();
 ReadingContext.Source = Data;
 ReadingContext.Length = Data.length;
 return ReadingContext;
};

function createBasicChunk()
{
  return _createBasicChunk();
}

function getChunkByType(_ReadingContext,ChunkType){
 let ReadingContext = NULL_READING_CONTEXT ;
 if (_ReadingContext) {
   ReadingContext = _ReadingContext;
 };
 let Chunks = getChunksByType(ReadingContext,ChunkType);
 if (!Chunks) {
    console.assert(false,
    "Can't retrieve chunk data, because the provided chunk type doesn't exist");
 };
 return Chunks[0];
};

function getChunksByType(_ReadingContext,ChunkType)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 if (_ReadingContext) {
   ReadingContext = _ReadingContext;
 };
 let Chunks = ReadingContext.Chunks[ChunkType];
 if (!Chunks) {
    console.assert(false,
        "Provided chunk type, doesn't have any chunks referenced to it"
    );
    return null;
 };
 return Chunks;
};

async function requestImageData(ImageURL)
{    
 let ResponseBody = new Response();
 ResponseBody = await fetch(ImageURL);
 if (!ResponseBody.ok) {
  console.error("Failed to fetch URL data\nStatus:\n" + ResponseBody.statusText);
  return null;
 };
 return await ResponseBody.bytes();
};

function readByte(_ReadingContext)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 if (_ReadingContext) {
   ReadingContext = _ReadingContext;
 };
 return ReadingContext.Source[ReadingContext.CurrentReadByte++];
};

function readBufferData(_ReadingContext,BufferLength)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 if (_ReadingContext) {
   ReadingContext = _ReadingContext;
 };
 let BufferData = new Uint8Array(BufferLength);
 for (let Index = 0;Index < BufferLength;Index++)
 {
  BufferData[Index] = (readByte(ReadingContext));
 };
 return BufferData;
}

function readCharString(_ReadingContext,StringLength)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 if (_ReadingContext) {
   ReadingContext = _ReadingContext;
 };
 let CharString = "";
 for (let Index = 0;Index < StringLength;Index++)
 {
  let Byte = readByte(_ReadingContext);
  let Char = String.fromCharCode(Byte);
  CharString+=Char;
 };
 return CharString;
};

function checkSignature(_ReadingContext) {
    let ReadingContext = NULL_READING_CONTEXT ;
    ReadingContext = _ReadingContext;
    for (let Index = 0;Index < PNG_SIGNATURE.length;Index++)
    {
     let Byte = readByte(ReadingContext);
     let ValidByte = PNG_SIGNATURE[Index];
     if (Byte == ValidByte) {
        continue;
     };
     return false;
    };
    return true;
};

function readNumber(_ReadingContext,SizeOf=4,IsSigned=false) {
 let ReadingContext = NULL_READING_CONTEXT ;
 ReadingContext = _ReadingContext;
 let Number = 0;
 let FirstByte = readByte(ReadingContext);

 let IsNegative = (FirstByte >> 7) == 1 && IsSigned;
 let NumberBits = SizeOf * 8;

 if (IsNegative) {
  NumberBits--;
  FirstByte = FirstByte << 1;
  FirstByte = FirstByte & BYTE_MAX;
  FirstByte = FirstByte >> 1;
 };

 Number += (FirstByte << ((SizeOf-1) * 8));

 for (let ByteIndex = 1;ByteIndex < SizeOf;ByteIndex++)
 {
  let Byte = readByte(ReadingContext);
  Number += (Byte << ((SizeOf-ByteIndex-1) * 8));
 };

 if (IsNegative) {
    Number = -Number;
 };

 return Number;
};

function isLowerCase(Char)
{
 let CharCode = Char.charCodeAt(0); //& BYTE_MAX;
 let LowerCase = ENUM_LOGICAL_BIT_OFFSETS.LOWER_CASE_BIT;
 return (CharCode & LowerCase) == LowerCase;
}

function getCRCOfBuffer(ByteBuffer){
 let CRC = BIT32_MAX;
 //bookmark not finished
}

function readChunk(_ReadingContext)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 ReadingContext = _ReadingContext;   

 let Chunk = createBasicChunk();

 let Length = readNumber(ReadingContext);
 let ChunkType = readCharString(ReadingContext,4);

 Chunk.ChunkType = ChunkType;
 Chunk.Data = readBufferData(ReadingContext,Length);

 Chunk.IsCriticial = !isLowerCase(ChunkType[0]);
 Chunk.IsPublic = !isLowerCase(ChunkType[1]); 
 Chunk.ReservedBit = !isLowerCase(ChunkType[2]);
 Chunk.SafeToCopy = isLowerCase(ChunkType[3]);

 Chunk.Length = Length;
 
 let CalcualtedCRC = getCRCOfBuffer();//bookmark to be calculated
 let CRC = readNumber(ReadingContext);
 CalcualtedCRC = CRC;//bookmark should be removed after fixes

 if (CRC != CalcualtedCRC) {
    console.assert(false,"Invalid Chunk Data");//later should be changed to warn
    return null;
 };

 return Chunk;
};

function readChunks(_ReadingContext){
 let ReadingContext = NULL_READING_CONTEXT;
 ReadingContext = _ReadingContext;   
 while (ReadingContext.Length - ReadingContext.CurrentReadByte > 0)
 {
  let ChunkData = readChunk(ReadingContext);
  if (!ChunkData) {
   console.assert("Error occured, while reading chunks");
   break;
  };
  ReadingContext.Chunks[ChunkData.ChunkType] = ReadingContext.Chunks[ChunkData.ChunkType] || [];
  ReadingContext.Chunks[ChunkData.ChunkType].push(ChunkData);
 };
};

function isColorTypeValidInCombinationWithBitDepth(ColorType,BitDepth)
{
  if (ColorType == (COLOR_TYPES.COLOR_USED)) {
  if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
    console.assert(false,"Invalid BitDepth for ColorType specified in standard");
    //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    return null;
 }}
 else if(ColorType == (COLOR_TYPES.PALETTE | COLOR_TYPES.COLOR_USED)){
  if (BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16){
        console.assert(false,"Invalid BitDepth for ColorType specified in standard");
    //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    return false;
  };
 } else if (ColorType == COLOR_TYPES.ALPHA_CHANNEL) {
  if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
    console.assert(false,"Invalid BitDepth for ColorType specified in standard");
    //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    return false;
  }
 }
 else if (ColorType == (COLOR_TYPES.ALPHA_CHANNEL | COLOR_TYPES.COLOR_USED)){
  if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
    console.assert(false,"Invalid BitDepth for ColorType specified in standard");
    //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    return false;
  }
 }
 else if (ColorType != 0)
 {
  console.assert(false,"ColorType, which doesn't fit the requirement for the standard specified");
  //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
  return false;
 }
 else {
  //do nothing
  //every bit depth is valid because colortype == 0;
  return true;
 };
 return true;
}

function getIHDRChunkData(_ReadingContext)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 ReadingContext = _ReadingContext;   
 let Width = 0,Height = 0;
 let BitDepth = 0;
 let ColorType = 0;
 let CompressionMethod = 0;
 let FilterMethod = 0;
 let InterlaceMethod = 0;

 let IHDRChunk = NULL_BASIC_CHUNK;
 IHDRChunk = getChunkByType(ReadingContext,"IHDR");

 if (!IHDRChunk) {
  console.assert(false,
   "IHDR Chunk doesn't exist, file is corrupted"
  );
  return null;
 };

 let IHDRDataReadingContext = createReadingContext(IHDRChunk.Data);

 Width = readNumber(IHDRDataReadingContext);
 Height = readNumber(IHDRDataReadingContext);
 BitDepth = readByte(IHDRDataReadingContext);
 ColorType = readByte(IHDRDataReadingContext);
 CompressionMethod = readByte(IHDRDataReadingContext);
 FilterMethod = readByte(IHDRDataReadingContext);
 InterlaceMethod = readByte(IHDRDataReadingContext);

 if (!isColorTypeValidInCombinationWithBitDepth(ColorType,BitDepth)){
  console.assert(false,
    "Invalid color type in combination with bit depth, according to the set standard");
  return null;
 }
 
 return {
  Width: Width,
  Height: Height,
  BitDepth: BitDepth,
  ColorType: ColorType,
  CompressionMethod: CompressionMethod,
  FilterMethod: FilterMethod,
  InterlaceMethod: InterlaceMethod,
 };
};

function getPLTEChunkData(_ReadingContext)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 ReadingContext = _ReadingContext;   

 let PLTEChunk = NULL_BASIC_CHUNK;
 PLTEChunk = getChunkByType(ReadingContext,"PLTE");

 if (!PLTEChunk) {
  console.assert(false,"PLTE Chunk doesn't exist within this file");
 };

 let IsInvalid = (PLTEChunk.Length % 3) != 0;
 if (IsInvalid) {
  console.assert(false,"Invalid PLTE Chunk Length");
  return null;
 };

 let ActiveEntires = PLTEChunk.Length / 3;
 let PLTEReadingContext = createReadingContext(PLTEChunk.Data);

 let PaletteEntries = [];

 for (let _ = 0;_ < ActiveEntires;_++)
 {
  let R = readByte(PLTEReadingContext);
  let G = readByte(PLTEReadingContext);
  let B = readByte(PLTEReadingContext);
  PaletteEntries.push(_createColor(R,G,B));
 };
 return {
  PaletteEntries: PaletteEntries,
 };
};

function inflate(_ReadingContext,CompressedData,UsedCompressionMethod)
{
 let ReadingContext = NULL_READING_CONTEXT;
 ReadingContext = _ReadingContext;  
 
 let CompressedDataReadingContext = createReadingContext(CompressedData);

 let CompressionMethod = readByte(CompressedDataReadingContext);
 let AdditionalFlags = readByte(CompressedDataReadingContext);

 let DecompressedData = inflateLZ77(CompressedData);
 if (!DecompressedData) {
  console.assert(false,
    "Something went wrong");
  return null;
 }
 return DecompressedData;
};

function mergeIDATChunks(_ReadingContext)
{
 let ReadingContext = NULL_READING_CONTEXT ;
 ReadingContext = _ReadingContext;   
 let IDATChunks = getChunksByType(ReadingContext,"IDAT");
 //bookmark unfinished
 let TotalLength = 0;
 for (let Index = 0;Index < IDATChunks.length;Index++)
 {
  let IDATChunk = NULL_BASIC_CHUNK;
  IDATChunk = IDATChunks[Index];
  TotalLength += IDATChunk.Length;
  let LocalReadingContext = createReadingContext(IDATChunk.Data);
  console.log(readByte(LocalReadingContext));
  console.log(readByte(LocalReadingContext));
 };

 let DataBuffer = new Uint8Array(TotalLength);
 let TotalIndex = 0;
 for (let Index = 0;Index < IDATChunks.length;Index++)
 {
  let IDATChunk = NULL_BASIC_CHUNK;
  IDATChunk = IDATChunks[Index];
  for (let InnerIndex = 0;InnerIndex < IDATChunk.Length;InnerIndex++)
  {
   DataBuffer[TotalIndex] = IDATChunk.Data[InnerIndex];
   TotalIndex++;
  };
 };
 return DataBuffer;
};

function reverseFilter(FilteredData,FilterMethod)
{
 
};

async function decode()
{
 if (TARGET_IMAGE_RESOURCE_TYPE == ENUM_TARGET_TYPES.FILE) {
    console.assert(false, 
     "File target type is not handled yet"
    );
    return -1;
 }
 let ImageURL = TARGET_IMAGE_RESOURCE;
 if (!isURLValid(ImageURL)) {
    console.assert(false,
     "The URL is invalid"
    );
    return -1;
 }
 let ImageData = await requestImageData(ImageURL);
 let ReadingContext = createReadingContext(ImageData);
 if (!checkSignature(ReadingContext)) {
   console.assert(false,
    "The file doesn't have the PNG signature"
   );
   return -1;
 };

 readChunks(ReadingContext);

 let IHDRChunk = getIHDRChunkData(ReadingContext);
 if (IHDRChunk.CompressionMethod != COMPRESSION_METHODS.LZ77)//only 1 compression/decompression method is supported
 {
  console.assert(false,"Undefined compression algorithm");
  return -1;
 };

 let IsFilterMethodValid = IHDRChunk.FilterMethod >= 0 && IHDRChunk.FilterMethod <= 4;
 if (!IsFilterMethodValid) {
  console.assert(false,
    "Unrecognized filter method");
  return -1;
 };

 let Data = mergeIDATChunks(ReadingContext);

 //inflating algorithm should then return the result in a single ByteArray
 //bookmark inflate
 Data = inflate(ReadingContext,Data);

 let IsFiltered = IHDRChunk.FilterMethod != FILTER_METHODS.None;

 if (IsFiltered) {
  //bookmark reverse filter action
  Data = reverseFilter(Data,IHDRChunk.FilterMethod);
 };

 if ((IHDRChunk.ColorType & COLOR_TYPES.PALETTE) == COLOR_TYPES.PALETTE)
 { 
  let PLTEChunk = getPLTEChunkData(ReadingContext);
 }; 

 //bookmark ready to interpret

 return 0;
};