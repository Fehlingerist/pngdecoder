class Vector8
{
 LastFreeIndex = 0;
 Capacity = 0;
 Array = new Uint8Array()

 constructor(SizeInBytes=0)
 { 
  this.Capacity = SizeInBytes;
  this.Array = new Uint8Array(SizeInBytes);
 };

 increaseCapacity()
 {
  this.Capacity *= 1.5;
  this.Capacity = Math.ceil(this.Capacity);
  try {
    let NewArray = new Uint8Array(this.Capacity);
    NewArray.set(this.Array);
    this.Array = NewArray;
  }catch(E) {
    console.assert(false, "Not enough memory / failed to create new array");
    return false;
  }
  return true;
 };

 insert(Byte,Index=-1)
 {
  if (Index == -1)
  {
   if (this.LastFreeIndex == this.Capacity)
   {
    let Success = this.increaseCapacity();
    if (!Success)
    {
     console.assert(false,"Can't insert element into an array");
     return false;
    };
   };
   Index = this.LastFreeIndex;
   this.LastFreeIndex++;
  };
  this.Array[Index] = Byte;
  return true;
 };
 readAt(Index)
 {
  if (this.LastFreeIndex <= Index)
  {
   console.assert(false,
    `Attempted to read an entry from outside of the 
    boundaries of the array.`
   );
   return null;
  };
  return this.Array[Index];
 };
}