import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:'AIzaSyB5anKSQiJUoqv3XFoBTHdlUIQiUVdZQrs',authDomain:'anatomy-study-tracker.firebaseapp.com',projectId:'anatomy-study-tracker',storageBucket:'anatomy-study-tracker.firebasestorage.app',messagingSenderId:'53912321374',appId:'1:53912321374:web:02ff45f86c369b506ba3cf'};
const keys=['anatomy-study-progress-v2','anatomy-study-partial-minutes-v1','anatomy-study-mock-v1','anatomy-study-daily-log-v1','anatomy-study-lecture-migration-v1','anatomy-study-priority-v1','anatomy-custom-videos-v1','anatomy-5-2'];
const auth=getAuth(initializeApp(config)),db=getFirestore(),provider=new GoogleAuthProvider();
const $=id=>document.getElementById(id),say=t=>$('cloud-status').textContent=t;
let user=null,ref=null,ready=false,busy=false,dirty=false,unsub=null,timer=null,lastRemote='';
const localData=()=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));
function apply(data){for(const k of keys){if(Object.hasOwn(data,k)){if(typeof data[k]==='string')localStorage.setItem(k,data[k]);else if(data[k]===null)localStorage.removeItem(k)}}location.reload()}
async function push(){if(!ready||!user||busy)return;busy=true;clearTimeout(timer);say('正在同步…');try{await setDoc(ref,{storage:localData(),updatedAt:serverTimestamp()});dirty=false;say('已同步至雲端 ✓')}catch(e){say('同步失敗，已保留本機紀錄：'+e.message)}finally{busy=false}}
window.addEventListener('anatomy-local-change',()=>{if(!ready)return;dirty=true;clearTimeout(timer);timer=setTimeout(push,800)});
$('cloud-login').onclick=async()=>{try{await signInWithPopup(auth,provider)}catch(e){if(e.code==='auth/popup-blocked')await signInWithRedirect(auth,provider);else say('登入失敗：'+e.message)}};
$('cloud-logout').onclick=()=>signOut(auth);
$('cloud-upload').onclick=async()=>{if(!confirm('確定用這台裝置的進度覆蓋雲端？請先匯出備份。'))return;ready=true;sessionStorage.setItem('cloud-sync-'+user.uid,'1');dirty=true;await push()};
$('cloud-download').onclick=async()=>{try{const snap=await getDoc(ref);if(!snap.exists()){say('雲端尚無紀錄，請先在 Mac 上傳。');return}if(!confirm('下載雲端進度將覆蓋這台裝置的紀錄，請先備份。確定繼續？'))return;sessionStorage.setItem('cloud-sync-'+user.uid,'1');apply(snap.data().storage||{})}catch(e){say('下載失敗：'+e.message)}};
onAuthStateChanged(auth,async u=>{if(unsub){unsub();unsub=null}user=u;ready=!!u&&sessionStorage.getItem('cloud-sync-'+u.uid)==='1';dirty=false;$('cloud-login').hidden=!!u;$('cloud-actions').hidden=!u;if(!u){say('請登入 Google 帳號以同步進度。');return}ref=doc(db,'users',u.uid);say('已登入 '+(u.email||'Google')+'，正在檢查雲端…');try{const snap=await getDoc(ref);if(!snap.exists())say('雲端尚無紀錄，請先在 Mac 按「上傳本機進度」。');else say(ready?'已啟用自動同步 ✓':'雲端已有紀錄，請在新裝置按「下載雲端進度」。');unsub=onSnapshot(ref,s=>{if(!s.exists()||!ready||busy||dirty)return;const data=s.data().storage||{},token=JSON.stringify(data);if(token===lastRemote)return;lastRemote=token;if(JSON.stringify(localData())!==token){say('收到其他裝置的更新，正在重新載入…');apply(data)}})}catch(e){say('讀取失敗：'+e.message)}});
