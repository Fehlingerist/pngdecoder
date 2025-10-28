const STDVector = (() => { 
 class Vector8
 {
  LastFreeIndex = 0;
  Capacity = 0;
  Array = new Uint8Array();
  Accumulation = 1.0;
  /**
   * @constructor
   * @overload
   * @param {number} Size
  */
  /**
   * @constructor
   * @overload
   * @param {Uint8Array} Array
  */
  /**
   * @constructor
   * @overload
   * @param {Uint8Array} Array
   * @param {number} [Offset]
   * @param {number} [Length]
  */
  constructor(Arg1,...Args)
  { 
   if (typeof(Arg1) == "number")
   {
    this.Capacity = SizeInBytes;
    this.Array = new Uint8Array(SizeInBytes);
   } else if (Arg1 instanceof Uint8Array && Args[0] !== undefined)
   {
    let Offset = Args[0];
    let Length = Args[1];
    this.Array = new Uint8Array(Arg1,Offset,Length);
    this.Capacity = this.Array.length;
    this.LastFreeIndex = this.Capacity;
   } else if(Arg1 instanceof Uint8Array && Args[0] == undefined)
   {
    let Offset = 0;
    let Length = Arg1.length;
    this.Array = new Uint8Array(Arg1,Offset,Length);
    this.Capacity = Length;
    this.LastFreeIndex = Length;
   } else {
     throw new Error("Unknown constructor invoked");
   };
  };
 
  resize(NewCapacity=this.Capacity*(++this.Accumulation))
  {
   this.Capacity = NewCapacity;
   this.Capacity = Math.ceil(this.Capacity);
   try {
     let NewArray = new Uint8Array(this.Capacity);
     NewArray.set(this.Array);
     this.Array = NewArray;
   }catch(E) {
     throw new Error("Not enough memory / failed to create new array");
     return false;
   }
   return true;
  };
 
  increaseCapacity()
  {
   return this.resize();
  };
 
  set(Byte=0,Index=-1)
  {
   if (Index == -1)
   {
    throw new Error ("Can't set Index of the array, when the said index is a typeof null");
    return false;
   };
   if (this.Capacity <= Index)
   {
    return this.resize(Index*(++this.Accumulation));
   };
   this.Array[Index] = Byte;
   return true;
  };
 
  insert(Byte=0,Index=-1)
  {
   if (Index == -1)
   {
    if (this.LastFreeIndex == this.Capacity)
    {
     let Success = this.increaseCapacity();
     if (!Success)
     {
      throw new Error("Can't insert element into an array");
      return false;
     };
    };
    Index = this.LastFreeIndex;
    this.LastFreeIndex++;
   };
   if (this.LastFreeIndex < Index)
   {
    throw new Error(`
     Can't set values outside of the last free index boundary. \n 
     for that, make use of set function, which is less restricted`);
    return false;
   } else if(this.LastFreeIndex == Index)
   {
    this.LastFreeIndex++;
   };
 
   this.Array[Index] = Byte;
   return true;
  };
  readAt(Index=-1)
  {
   if (this.LastFreeIndex <= Index || Index < 0)
   {
    throw new Error(
     `Attempted to read an entry from outside of the 
     boundaries of the array.`
    );
    return null;
   };
   return this.Array[Index];
  };
 }

 const NULL_VECTOR8 = new Vector8();

 const Obj = {
   Vector8: Vector8,
   NULL_VECTOR8: NULL_VECTOR8
  };  

 return function()
 {
  return Obj;
 };
})();

