function PNG()
{
  const NMLZ77 = LZ77();
  const NMChunks = Chunks();
  const PNG_SIGNATURE = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10]);

  const NULL_UINT8ARRAY = NMChunks.NULL_UINT8ARRAY;
  
  let readByte = NMChunks.readByte;
  let readNumber = NMChunks.readNumber;

  let readChunks = NMChunks.readChunks;
  let getChunkByType = NMChunks.getChunkByType;
  let setContextOfReadingContextFromChunk = NMChunks.setContextOfReadingContextFromChunk;
  let createReadingContext = NMChunks.createReadingContext;


  const ENUM_TARGET_TYPES = Object.freeze({
   URL: 0,
   FILE: 1,
   RAW: 2,
  });
  const BIT_DEPTHS = Object.freeze({
   BIT1: 0b1,
   BIT2: 0b10,
   BIT4: 0b100,
   BIT8: 0b1000,
   BIT16:0b10000,
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
  const BYTE_MAX = Math.pow(2,8) - 1; 
  const BIT32_MAX = Math.pow(2,32) - 1;

  const Vector = STDVector();

  const Vector8 = Vector.Vector8;
  const NULL_VECTOR8 = Vector.NULL_VECTOR8;
  const NULL_READING_CONTEXT = NMChunks._createReadingContext();
  const NULL_BASIC_CHUNK = NMChunks._createBasicChunk();
  const NULL_NCDS_READING_CONTEXT = NMChunks._createMultiChunkReadingContext();

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

  function isColorTypeValidInCombinationWithBitDepth(ColorType,BitDepth)
  {
    if (ColorType == (COLOR_TYPES.COLOR_USED)) {
    if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
      throw new Error("Invalid BitDepth for ColorType specified in standard");
      //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
   }}
   else if(ColorType == (COLOR_TYPES.PALETTE | COLOR_TYPES.COLOR_USED)){
    if (BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16){
          throw new Error("Invalid BitDepth for ColorType specified in standard");
      //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    };
   } else if (ColorType == COLOR_TYPES.ALPHA_CHANNEL) {
    if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
      throw new Error("Invalid BitDepth for ColorType specified in standard");
      //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    }
   }
   else if (ColorType == (COLOR_TYPES.ALPHA_CHANNEL | COLOR_TYPES.COLOR_USED)){
    if (!(BitDepth == BIT_DEPTHS.BIT8 || BitDepth == BIT_DEPTHS.BIT16)){
      throw new Error("Invalid BitDepth for ColorType specified in standard");
      //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
    }
   }
   else if (ColorType != 0)
   {
    throw new Error("ColorType, which doesn't fit the requirement for the standard specified");
    //https://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
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
    throw new Error("IHDR Chunk doesn't exist, file is corrupted");
   };

   let IHDRDataReadingContext = createReadingContext(IHDRChunk.Data);
   setContextOfReadingContextFromChunk(IHDRDataReadingContext,IHDRChunk);

   Width = readNumber(IHDRDataReadingContext);
   Height = readNumber(IHDRDataReadingContext);
   BitDepth = readByte(IHDRDataReadingContext);
   ColorType = readByte(IHDRDataReadingContext);
   CompressionMethod = readByte(IHDRDataReadingContext);
   FilterMethod = readByte(IHDRDataReadingContext);
   InterlaceMethod = readByte(IHDRDataReadingContext);

   if (!isColorTypeValidInCombinationWithBitDepth(ColorType,BitDepth)){
    throw new Error("Invalid color type in combination with bit depth, according to the set standard");
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
    throw new Error("PLTE Chunk doesn't exist within this file");
   };

   let IsInvalid = (PLTEChunk.Length % 3) != 0;
   if (IsInvalid) {
    throw new Error("Invalid PLTE Chunk Length");
   };

   let ActiveEntires = PLTEChunk.Length / 3;
   let PLTEReadingContext = createReadingContext(PLTEChunk.Data);
   setContextOfReadingContextFromChunk(PLTEReadingContext,PLTEChunk);

   let PaletteEntries = [];
   for (let Index = 0;Index < ActiveEntires;Index++)
   {
    PaletteEntries[Index] = _createColor(
     readByte(PLTEReadingContext)
    ,readByte(PLTEReadingContext)
    ,readByte(PLTEReadingContext)
    );
   };

   return {
    PaletteEntries: PaletteEntries,
   };
  };

  function decompress(_ReadingContext,CompressionMethod)
  {
   let ReadingContext = NULL_READING_CONTEXT;
   ReadingContext = _ReadingContext;  

   let DecompressedData = null;

   if (CompressionMethod == COMPRESSION_METHODS.LZ77)//only 1 compression/decompression method is supported
   {
    DecompressedData = NMLZ77.inflateLZ77(ReadingContext);
   } else{
    throw new Error("Undefined compression algorithm");  
    return null;
   };
   if (!DecompressedData) {
    throw new Error(
      "Something went wrong");
    return null;
   }
   return DecompressedData;
  };

  function reverseFilter(FilteredData,FilterMethod)
  {
  
  };

  async function decode(TARGET_IMAGE_RESOURCE,TARGET_IMAGE_RESOURCE_TYPE)
  {
   let ImageData = new Uint8Array();
   if (TARGET_IMAGE_RESOURCE_TYPE == ENUM_TARGET_TYPES.FILE) {
      throw new Error("Error: The file type is not handled yet");
      return -1;
   } else if (TARGET_IMAGE_RESOURCE_TYPE == ENUM_TARGET_TYPES.URL)
   {
      let ImageURL = TARGET_IMAGE_RESOURCE;
      if (!isURLValid(ImageURL)) {
         throw new Error("Error: The URL is invalid");
         return -1;
      }
      ImageData = await requestImageData(ImageURL);
   }
   else if (TARGET_IMAGE_RESOURCE == ENUM_TARGET_TYPES.RAW)
   {
    ImageData = (new TextEncoder().encode(TARGET_IMAGE_RESOURCE));
   } else {
    throw new Error("Error: Target image resource type not recognized");
   }

   let ReadingContext = createReadingContext(ImageData);

   if (!checkSignature(ReadingContext)) {
     throw new Error(
      "The file doesn't have the PNG signature"
     );
     return -1;
   };

   readChunks(ReadingContext);

   let IHDRChunk = getIHDRChunkData(ReadingContext);

   let IsFilterMethodValid = IHDRChunk.FilterMethod >= 0 && IHDRChunk.FilterMethod <= 4;
   if (!IsFilterMethodValid) {
    throw new Error("Error: Unrecognized filter method");
    return -1;
   };

   let Data = NULL;
   //inflating algorithm should then return the result in a single ByteArray
   //bookmark inflate
   Data = decompress(ReadingContext,IHDRChunk.CompressionMethod);

   if (!Data) {
    throw new Error("Data couldn't be decompressed successfully");
    return -1;
   };

   let IsFiltered = IHDRChunk.FilterMethod != FILTER_METHODS.None;

   if (IsFiltered) {
    //bookmark reverse filter action
    Data = reverseFilter(Data,IHDRChunk.FilterMethod);
   };

   //bookmark
   //PLTE logic should be before adam7, because data is stored at interlacing stage...
   if ((IHDRChunk.ColorType & COLOR_TYPES.PALETTE) == COLOR_TYPES.PALETTE)
   { 
    let PLTEChunk = getPLTEChunkData(ReadingContext,IHDRChunk.ColorType);
   }; 

   //reverse the effects of Adam7 algorithm
   //adam7Rev(Data);

   //bookmark ready to interpret

   return Data;
  };
  return {
   _createColor: _createColor,
   decode: decode,
  };
};