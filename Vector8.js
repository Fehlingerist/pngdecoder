class Vector8
{
 LastFreeIndex = 0;
 Capacity = 0;
 Array = new Uint8Array();
 Accumulation = 1.0;

 constructor(SizeInBytes=0)
 { 
  this.Capacity = SizeInBytes;
  this.Array = new Uint8Array(SizeInBytes);
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
    throw new Error( "Not enough memory / failed to create new array");
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