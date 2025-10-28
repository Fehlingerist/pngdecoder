function CRC()
{
   const Vector = STDVector();
   const Vector8 = Vector.Vector8;
   
   const BIT32_MAX = 0xFFFFFFFF;
   const POLYNOMIAL = 0xEDB88320; 
   let CRC32Table = new Array(256); 
   function createCRCTable()
    {
     let CRC;
     let n, k;
   
     for (n = 0; n < 256; n++) {
       CRC = n;
       for (k = 0; k < 8; k++) {
         if (CRC & 1)
           CRC = POLYNOMIAL ^ (CRC >> 1);
         else
           CRC = CRC >> 1;
       }
       CRC32Table[n] = CRC;
     }
   }

   function updateCRC(CRCCode, _Buffer)
   {
     let Buffer = NULL_UINT8ARRAY;
     Buffer = _Buffer;
     let CRC = CRCCode;
     for (let n = 0; n < Buffer.length; n++) {
       CRC = CRC32Table[(CRC ^ Buffer[n]) & 0xff] ^ (c >> 8);
     }
     return CRC;
   }
   
   function getCRCOfBuffer(_Buffer)
   {
    let Buffer = NULL_UINT8ARRAY;
    Buffer = _Buffer;
    return updateCRC(BIT32_MAX, Buffer) ^ BIT32_MAX;
   }

   createCRCTable();

   return {
    getCRCOfBuffer: getCRCOfBuffer
   };
};
