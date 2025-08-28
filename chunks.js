function Chunks()
{
  const ENUM_LOGICAL_BIT_OFFSETS = Object.freeze({
      LOWER_CASE_BIT: 32,
  });

  const BYTE_MAX = Math.pow(2,8) - 1; 
  const BIT32_MAX = Math.pow(2,32) - 1;

  const NULL_VECTOR8 = new Vector8(0);
  const NULL_READING_CONTEXT = _createReadingContext();
  const NULL_BASIC_CHUNK = _createBasicChunk();
  const NULL_NCDS_READING_CONTEXT = _createMultiChunkReadingContext();


  function _createMultiChunkReadingContext()
  {
   return {
    Chunks: {},
    ReadingContext: NULL_READING_CONTEXT,
    CurrentChunkIndex: 0,
    CurrentGlobalChunkIndex: 0,
    Length: 0, //sum of all lengths of Chunks
    LastReadByteValue: 0,
    ChunkType: ""
   };
  };

  function _createReadingContext()
  {
   let ReadingContext = {
    Source: new Uint8Array(),
    Length: 0,

    Start: 0,//this is used for elements of the Source data block in the context of png file format
    End: 0,

    CurrentReadByte: 0,
    Chunks: {},
   };   
   return ReadingContext;
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
 
     OffsetInData: 0,
     
     Length: 0,
   };
 };

  function isLowerCase(Char)
  {
   let CharCode = Char.charCodeAt(0); //& BYTE_MAX;
   let LowerCase = ENUM_LOGICAL_BIT_OFFSETS.LOWER_CASE_BIT;
   return (CharCode & LowerCase) == LowerCase;
  };

 function createMultiChunkReadingContext(_ReadingContext,ChunkType)
  {
    let ReadingContext = NULL_READING_CONTEXT;
    ReadingContext = _ReadingContext;

    let MultiChunkReaderContext = _createMultiChunkReadingContext();
    let Chunks = getChunksByType(ReadingContext,ChunkType);
    if (!Chunks) 
    {
     console.assert("There's no such a chunk type within the reading context");
     return NULL_NCDS_READING_CONTEXT;
    };

    for (let Index = 0;Index < Chunks.length;Index++)
    {
     let Chunk = NULL_BASIC_CHUNK;
     Chunk = Chunks[Index];
     MultiChunkReaderContext.Length += Chunk.Length;
    }

    MultiChunkReaderContext.Chunks = Chunks;
    MultiChunkReaderContext.ReadingContext = ReadingContext;
    MultiChunkReaderContext.LastReadByteValue = readCurrentByte(ReadingContext);

    setContextOfReadingContextFromChunk(
      ReadingContext,
      Chunks[MultiChunkReaderContext.CurrentChunkIndex]
    );
    //it's safe to read first chunk at this stage
    return MultiChunkReaderContext;
  };

  function NCDSReadCurrentByte(_MultiChunkReadingContext) //Non Continous Data Stream Read byte
  {
    let MultiChunkReaderContext = NULL_NCDS_READING_CONTEXT;
    MultiChunkReaderContext = _MultiChunkReadingContext;

    return MultiChunkReaderContext.LastReadByteValue;
  };

  function NCDSReadByte(_MultiChunkReadingContext) //Non Continous Data Stream Read byte
  {
    let MultiChunkReaderContext = NULL_NCDS_READING_CONTEXT;
    MultiChunkReaderContext = _MultiChunkReadingContext;

    if (MultiChunkReaderContext.Length == MultiChunkReaderContext.CurrentGlobalChunkIndex)
    {
     console.assert("There is no more memory to read within the context.");
     return null;
    };

    let InnerIndex = MultiChunkReaderContext.ReadingContext.CurrentReadByte;
    let LastByte = MultiChunkReaderContext.ReadingContext.LastByte;

    if (InnerIndex == LastByte)
    {
     MultiChunkReaderContext.CurrentChunkIndex++;
     setContextOfReadingContextFromChunk(
      MultiChunkReaderContext.ReadingContext,
      MultiChunkReaderContext.Chunks[MultiChunkReaderContext.CurrentChunkIndex]
     );
    } else if (InnerIndex >= LastByte)
    {
     console.assert(false,
      "Bug occured"
     );
    };
    let Byte = readByte(MultiChunkReaderContext.ReadingContext);

    if (Byte === null || Byte === undefined)
    {
     console.assert(
      false,
      "Trying to read a byte, which doesn't exist"
     );
     return null;
    };

    MultiChunkReaderContext.LastReadByteValue = Byte;
    MultiChunkReaderContext.CurrentGlobalChunkIndex++;
 
    return Byte;
  };

  function NCDSReadNumber(_MultiChunkReadingContext,SizeOf=4,IsSigned=false) //Non Continous Data Stream Read byte
  { 
   let MultiChunkReadingContext = NULL_NCDS_READING_CONTEXT;
   MultiChunkReadingContext = _MultiChunkReadingContext;

   let Number = 0;
   let FirstByte = NCDSReadByte(MultiChunkReadingContext);

   let IsNegative = (FirstByte >> 7) == 1 && IsSigned;
   let NumberBits = SizeOf * 8;

   if (IsNegative) {
    NumberBits--;
    FirstByte = FirstByte << 1;
    FirstByte = FirstByte & BYTE_MAX;
    FirstByte = FirstByte >> 1;
   };

   Number += FirstByte * (2 ** (NumberBits - 8));

   for (let ByteIndex = 1;ByteIndex < SizeOf;ByteIndex++)
   {
    let Byte = NCDSReadByte(MultiChunkReadingContext);
    Number += Byte * (2 ** (NumberBits - (ByteIndex+1) * 8));
   };

   if (IsNegative) {
      Number = -Number;
   };

   return Number;
  };

  function chunkHasBeenRead(_ReadingContext,_BasicChunk){
   let ReadingContext = NULL_READING_CONTEXT;
   let BasicChunk = NULL_BASIC_CHUNK;
   ReadingContext = _ReadingContext;
   BasicChunk = _BasicChunk;
   ReadingContext.CurrentReadByte += BasicChunk.Length;
  }

  function setContextOfReadingContextFromChunk(_ReadingContext,_BasicChunk)
  {
   let ReadingContext = NULL_READING_CONTEXT;
   let BasicChunk = NULL_BASIC_CHUNK;
   ReadingContext = _ReadingContext;
   BasicChunk = _BasicChunk;

   if (!ReadingContext)
   {
    console.assert(false,"Reading context doesn't exist");
    return null;
   }
   if (!BasicChunk)
   {
    console.assert(false,"Chunk doesn't exist");
    return null;
   }

   ReadingContext.Start = BasicChunk.OffsetInData;
   ReadingContext.LastByte = BasicChunk.OffsetInData + BasicChunk.Length;

   ReadingContext.CurrentReadByte = 0;
  };

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
  };

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

    function readByte(_ReadingContext)
  {
   let ReadingContext = NULL_READING_CONTEXT;
   ReadingContext = _ReadingContext;
   return ReadingContext.Source[ReadingContext.Start + ReadingContext.CurrentReadByte++];
  };

  function assignChunkBoundaries(_BasicChunk,Offset)
  {
   let BasicChunk = NULL_BASIC_CHUNK;
   BasicChunk = _BasicChunk;
   BasicChunk.OffsetInData = Offset;
  };

  function readCharString(_ReadingContext,StringLength)
  {
   let ReadingContext = NULL_READING_CONTEXT;
   ReadingContext = _ReadingContext;
   let CharString = "";
   for (let Index = 0;Index < StringLength;Index++)
   {
    let Byte = readByte(_ReadingContext);
    let Char = String.fromCharCode(Byte);
    CharString+=Char;
   };
   return CharString;
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

   Number += FirstByte * (2 ** NumberBits);

   for (let ByteIndex = 1;ByteIndex < SizeOf;ByteIndex++)
   {
    let Byte = readByte(ReadingContext);
    Number += Byte * (2 ** (NumberBits - (ByteIndex+1) * 8));
   };

   if (IsNegative) {
      Number = -Number;
   };

   return Number;
  };

  function readCurrentByte(_ReadingContext)
  {
   let ReadingContext = NULL_READING_CONTEXT;
   ReadingContext = _ReadingContext;
  
   return ReadingContext.Source[ReadingContext.Start + ReadingContext.CurrentReadByte];
  };

  function readBufferData(_ReadingContext,BufferLength)
  {
   warn("Function is no longer needed - stop the use of it");
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
    function getCRCOfBuffer(ByteBuffer){
   let CRC = BIT32_MAX;
   //bookmark unfinished
  }

  function readChunk(_ReadingContext)
  {
   let ReadingContext = NULL_READING_CONTEXT ;
   ReadingContext = _ReadingContext;   

   let Chunk = createBasicChunk();

   let Length = readNumber(ReadingContext);
   let ChunkType = readCharString(ReadingContext,4);

   let Offset = ReadingContext.CurrentReadByte;
   assignChunkBoundaries(Chunk,Offset);

   Chunk.ChunkType = ChunkType;
   Chunk.Data = ReadingContext.Source;

   Chunk.IsCriticial = !isLowerCase(ChunkType[0]);
   Chunk.IsPublic = !isLowerCase(ChunkType[1]); 
   Chunk.ReservedBit = !isLowerCase(ChunkType[2]);
   Chunk.SafeToCopy = isLowerCase(ChunkType[3]);

   Chunk.Length = Length;

   let CalcualtedCRC = getCRCOfBuffer(ReadingContext,Chunk);//bookmark to be calculated
   chunkHasBeenRead(ReadingContext,Chunk);//technically no and it's CRC's job
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


 return {
   _createMultiChunkReadingContext: _createMultiChunkReadingContext,
   _createReadingContext: _createReadingContext,
   _createBasicChunk: _createBasicChunk,

   createMultiChunkReadingContext: createMultiChunkReadingContext,
   
   NCDSReadByte: NCDSReadByte,
   NCDSReadCurrentByte: NCDSReadCurrentByte,
   NCDSReadNumber: NCDSReadNumber,

   chunkHasBeenRead: chunkHasBeenRead,
   
   createReadingContext: createReadingContext,
   createBasicChunk: createBasicChunk,
   
   getChunkByType: getChunkByType,
   getChunksByType: getChunksByType,

   readByte: readByte,
   readNumber: readNumber,

   readCurrentByte: readCurrentByte,
   readBufferData: readBufferData,

   readChunks: readChunks,

   setContextOfReadingContextFromChunk: setContextOfReadingContextFromChunk,
 };
};