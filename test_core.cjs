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
// --- Synthetic camera-photo test: perspective warp + shading + noise + blur, then auto-detect corners and decode ---
function solveLin(a,b){let n=b.length,m=a.map((r,i)=>[...r,b[i]]);for(let i=0;i<n;i++){let p=i;for(let k=i+1;k<n;k++)if(Math.abs(m[k][i])>Math.abs(m[p][i]))p=k;[m[i],m[p]]=[m[p],m[i]];let q=m[i][i];for(let j=i;j<=n;j++)m[i][j]/=q;for(let k=0;k<n;k++)if(k!==i){let f=m[k][i];for(let j=i;j<=n;j++)m[k][j]-=f*m[i][j];}}return m.map(r=>r[n]);}
function makeH(src,dst){let a=[],b=[];for(let i=0;i<4;i++){let [x,y]=src[i],[u,v]=dst[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);}let h=solveLin(a,b);return (x,y)=>{let d=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];};}
let seed=42;function rnd(){seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;}
function synthPhoto(cells,n,W,H,pts){
let inv=makeH(pts,[[0,0],[n,0],[n,n],[0,n]]);
let raw=new Float32Array(W*H*3);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let [mx,my]=inv(x,y);let col;
if(mx>=-4&&mx<n+4&&my>=-4&&my<n+4){let gx=Math.floor(mx),gy=Math.floor(my);col=(gx<0||gy<0||gx>=n||gy>=n)?[255,255,255]:COLORS[cells[gy*n+gx]];}
else col=[72,66,60];
let shade=0.86+0.14*(x/W),i=(y*W+x)*3;raw[i]=col[0]*shade;raw[i+1]=col[1]*shade;raw[i+2]=col[2]*0.92*shade;}
let data=new Uint8ClampedArray(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let i=(y*W+x)*3,s=[0,0,0],cnt=0;
for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;let j=(yy*W+xx)*3;s[0]+=raw[j];s[1]+=raw[j+1];s[2]+=raw[j+2];cnt++;}
let o=(y*W+x)*4;for(let k=0;k<3;k++)data[o+k]=s[k]/cnt+(rnd()-0.5)*22;data[o+3]=255;}
return data;}
function photoCase(n,payload,name,ecc,W,pts){
let cells=encode(payload,n,name,ecc);let data=synthPhoto(cells,n,W,W,pts);
let found=detectCorners(data,W,W,n);
if(!found){console.log('photo',n,'DETECT FAILED');return;}
let err=Math.max(...found.map((p,i)=>Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1])));
global.homography=(p,m)=>makeH([[0,0],[m,0],[m,m],[0,m]],p);
let refined=refineCorners(data,W,W,n,found);
let r=decodePixels(data,W,W,n,makeH([[0,0],[n,0],[n,n],[0,n]],refined));
console.log('photo',n,'corner err px',err.toFixed(1),'name',r.name,'bytes match',Buffer.compare(Buffer.from(r.bytes),Buffer.from(payload)));}
photoCase(81,new TextEncoder().encode('shot on a phone, hopefully'), 'photo.txt',1,1200,[[250,300],[880,240],[940,880],[190,940]]);
photoCase(177,Uint8Array.from({length:2000},(_,i)=>(i*29+1)%256),'scan.bin',1,2000,[[420,500],[1470,400],[1570,1470],[320,1570]]);
photoCase(177,Uint8Array.from({length:1500},(_,i)=>(i*41+7)%256),'std.bin',0,2000,[[500,350],[1600,520],[1450,1600],[300,1450]]);
// Extreme pose (~35 deg roll + hard keystone): detection must refuse (null) rather than lock onto a look-alike cluster — a live scanner retries as the user aligns the code.
{let cells=encode(new TextEncoder().encode('tilt'),177,'tilt.bin',1);let data=synthPhoto(cells,177,2000,2000,[[600,700],[1750,300],[1650,1100],[450,1750]]);
console.log('photo tilt detect (want null)',detectCorners(data,2000,2000,177));}
console.log('photo blank detect (want null)',detectCorners(new Uint8ClampedArray(400*400*4).map((v,i)=>i%4===3?255:70),400,400,81));
