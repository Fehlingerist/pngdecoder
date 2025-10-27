function CRC()
{
    const BIT32_MAX = 0xFFFFFFFF;
    const POLYNOMIAL = 0xEDB88320;

    let CRC32Table = new Array(256);

    function makeCRCTable()
    {
     let c;
     let n, k;
   
     for (n = 0; n < 256; n++) {
       c = n;
       for (k = 0; k < 8; k++) {
         if (c & 1)
           c = 0xedb88320 ^ (c >> 1);
         else
           c = c >> 1;
       }
       crc_table[n] = c;
     }
     crc_table_computed = 1;
    }


    function getCRCOfBuffer()
    {

    };

    return {
        
    };
};
