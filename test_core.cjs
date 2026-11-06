const fs=require('fs'),vm=require('vm');let html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8'),src=html.split('<script>')[1].split('</script>')[0];let start=src.indexOf('const COLORS='),end=src.indexOf('function draw(cells,n)');let core=src.slice(start,end).replace('let cameraStream=null,sourceImage=null,corners=[],currentCanvas=null,decodedBytes=null,decodedName=\'decoded.bin\';','');let start2=src.indexOf('function decodeDigits('),end2=src.indexOf('function decodeImagePixels');core+='\n'+src.slice(start2,end2);vm.runInThisContext(core);function digitsFromCells(cells,n){let a=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!reserved(n,x,y))a.push(cells[y*n+x]);return a}
for(let n of [81,177,577]){let len=n===577?75000:100;let data=Uint8Array.from({length:len},(_,i)=>(i*117+13)%256);let cells=encode(data,n);let d=decodeDigits(digitsFromCells(cells,n),n);console.log(n,len,d.bytes.length,Buffer.compare(Buffer.from(d.bytes),Buffer.from(data)));}
let block=rsEncodeBlock(Uint8Array.from({length:239},(_,i)=>i));for(let count of [1,4,8,9]){let b=block.slice();for(let i=0;i<count;i++)b[i*20]^=17+i;try{let out=rsDecodeBlock(b);console.log('corrupt',count,Buffer.compare(Buffer.from(out),Buffer.from(block.slice(0,239))));}catch(e){console.log('corrupt',count,'FAIL',e.message)}}// v3: filename stored in header round-trips; overlong names cap at 255 bytes keeping the extension
let named=decodeDigits(digitsFromCells(encode(Uint8Array.from({length:64},(_,i)=>(i*7+3)%256),177,'Quarterly Report.pdf'),177),177);
console.log('v3 filename',named.version,named.name,Buffer.compare(Buffer.from(named.bytes),Buffer.from(Uint8Array.from({length:64},(_,i)=>(i*7+3)%256))));
let longNamed=decodeDigits(digitsFromCells(encode(new TextEncoder().encode('x'),81,'a'.repeat(300)+'.pdf'),81),81);
console.log('v3 long filename bytes',new TextEncoder().encode(longNamed.name).length,longNamed.name.endsWith('.pdf'));
// 666 x 666 grid: a 91.4 KiB (93,594-byte) payload plus filename fits again (v1-era headroom, with RS)
let big=Uint8Array.from({length:93594},(_,i)=>(i*53+11)%256);
let bigRt=decodeDigits(digitsFromCells(encode(big,666,'big.pdf'),666),666);
console.log('666 roundtrip',bigRt.bytes.length,bigRt.name,Buffer.compare(Buffer.from(bigRt.bytes),Buffer.from(big)));
try{encode(big,577,'big.pdf');console.log('577 overflow NOT detected');}catch(e){console.log('577 still rejects 93,594 bytes + filename as expected');}
// v4 heavy ECC: RS(255,127) block correction limits (64 ok, 65 rejected)
let hblock=rsEncodeBlock(Uint8Array.from({length:127},(_,i)=>i),128);
for(let count of [32,64,65]){let b=hblock.slice();for(let i=0;i<count;i++)b[i*3]^=29+i;try{let out=rsDecodeBlock(b,128);console.log('heavy corrupt',count,Buffer.compare(Buffer.from(out),Buffer.from(hblock.slice(0,127))));}catch(e){console.log('heavy corrupt',count,'FAIL',e.message)}}
// v4 round trips: standard and heavy, with filenames
for(let ecc of [0,1]){let data=Uint8Array.from({length:4000},(_,i)=>(i*37+5)%256);let rt=decodeDigits(digitsFromCells(encode(data,177,'data.bin',ecc),177),177);console.log('v4 ecc',ecc,'version',rt.version,'ecc',rt.ecc,'name',rt.name,Buffer.compare(Buffer.from(rt.bytes),Buffer.from(data)));}
// heavy capacity at 666 is 62,976 bytes; a 62,900-byte payload + filename fits, 91.4 KiB does not
let hdata=Uint8Array.from({length:62900},(_,i)=>(i*19+3)%256);let hrt=decodeDigits(digitsFromCells(encode(hdata,666,'big.pdf',1),666),666);console.log('heavy 666 roundtrip',hrt.bytes.length,hrt.name,Buffer.compare(Buffer.from(hrt.bytes),Buffer.from(hdata)));
try{encode(new Uint8Array(93594),666,'big.pdf',1);console.log('heavy overflow NOT detected');}catch(e){console.log('heavy 666 rejects 93,594 bytes as expected');}
// end-to-end digit damage: heavy survives 1 flipped digit in each of 12 groups of block 1 (<=48 bad bytes < 64); standard survives 2 groups (<=8)
function flipGroups(cells,n,groups){let d=digitsFromCells(cells,n);for(let g of groups)d[g*14+5]=(d[g*14+5]+1)%5;return d;}
let small=new TextEncoder().encode('damage test payload');console.log('heavy digit damage',Buffer.compare(Buffer.from(decodeDigits(flipGroups(encode(small,177,'d.txt',1),177,[0,1,2,3,4,5,6,7,8,9,10,11]),177).bytes),Buffer.from(small)));
console.log('standard digit damage',Buffer.compare(Buffer.from(decodeDigits(flipGroups(encode(small,177,'d.txt',0),177,[0,1]),177).bytes),Buffer.from(small)));
