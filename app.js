(function(){
var A="0xA575B7169a9A1c8B22f64bd32199e0aC9e4481fC", START=131563000;
var RPCS=["https://bsc-rpc.publicnode.com","https://bsc-dataseed.bnbchain.org","https://bsc-dataseed1.defibit.io"];
var ABI=["function stats() view returns (uint256,uint256,uint256,uint256,bool,bool)","event Minted(address indexed agent,uint256 firstSerial,uint256 shares,uint256 paid)"];
var p=new ethers.FallbackProvider(RPCS.map(function(u,i){return {provider:new ethers.JsonRpcProvider(u,56,{staticNetwork:true}),priority:i+1,weight:1}}),56,{quorum:1});
var c=new ethers.Contract(A,ABI,p);
function $(i){return document.getElementById(i)}
function short(a){return a.slice(0,6)+"…"+a.slice(-4)}
async function stats(){try{
  var s=await c.stats();var m=Number(s[0]);
  $("minted").textContent=m.toLocaleString();$("fill").style.width=Math.max(.5,m/120)+"%";
  $("price").textContent=m>=12000?"sold out":(s[2]==0n?"FREE":ethers.formatEther(s[2])+" BNB");
  $("pool").textContent=Number(ethers.formatEther(s[3])).toFixed(4)+" BNB";
  $("status").textContent=s[5]?"Pool live":(s[4]?(m<500?"Free mint live":"Paid mint live"):"Closed");
}catch(e){console.log(e)}}
async function shares(){
  var rp=new ethers.JsonRpcProvider(RPCS[0],56,{staticNetwork:true});var rc=new ethers.Contract(A,ABI,rp);
  var head=await rp.getBlockNumber();var step=5000,out=[],ranges=[];
  for(var b=START;b<=head;b+=step)ranges.push([b,Math.min(b+step-1,head)]);
  var limit=ranges.slice(-60); // most recent ~7h of blocks if many
  for(var i=0;i<limit.length;i+=4){
    var part=await Promise.all(limit.slice(i,i+4).map(function(r){return rc.queryFilter("Minted",r[0],r[1]).catch(function(){return []})}));
    part.forEach(function(x){out=out.concat(x)});
  }
  var g=$("grid");g.innerHTML="";var items=[];
  out.forEach(function(e){var f=Number(e.args[1]),n=Number(e.args[2]);for(var k=0;k<n;k++)items.push({s:f+k,a:e.args[0],paid:e.args[3]>0n,tx:e.transactionHash})});
  items.sort(function(x,y){return y.s-x.s});
  if(!items.length){g.innerHTML='<p class="small">No shares minted yet.</p>';return}
  $("sharesNote").textContent="("+items.length+" shown, newest first)";
  items.slice(0,600).forEach(function(it){var d=document.createElement("div");d.className="share";
    d.innerHTML="<b>#"+it.s+"</b>"+(it.paid?"Paid":"Free")+'<br><a target="_blank" rel="noopener" href="https://bscscan.com/tx/'+it.tx+'">'+short(it.a)+"</a>";g.appendChild(d)});
}
document.querySelectorAll(".copy").forEach(function(b){b.addEventListener("click",function(){
  var t=$(b.dataset.t).textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copied ✓"},function(){
    var r=document.createRange();r.selectNode($(b.dataset.t));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent="Selected, copy it"})})});
stats();shares().catch(function(e){$("grid").innerHTML='<p class="small">Could not load the share list right now.</p>'});
setInterval(stats,20000);
})();
