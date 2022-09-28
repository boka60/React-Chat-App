import React, { useRef, useState, useEffect} from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, query, orderBy, serverTimestamp, collection, addDoc, doc, limit, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

const adminID = "";
const adminEmail = "";

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">   
      <header>
        <h1>Chat</h1>
        <SignOut />
      </header>
      <section>
        {user ? <ReactChat /> : <SignIn />}
      </section>    
    </div>  
  );
}

function SignIn() {
  const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()}>Logout</button>
  )
}

async function isUserBanned(email) {
  const isBannedRef = doc(db, "bannedUsers", email);
  const bannedSnap = await getDoc(isBannedRef);

  if(bannedSnap.data() == null)
    return false;

  if(bannedSnap.data().email === email){;
    return true;
  }else if(bannedSnap.data().email == null){
    return false;
  }else {
    return false; 
  }
}

async function checkUserBan() {
  const docRef = doc(db, "bannedUsers", auth.currentUser.uid);
  const docSnap = await getDoc(docRef);
  if(docSnap.exists()){
    auth.signOut(); 
    window.location.reload();
  }
}

function ReactChat() {
  
  checkUserBan();

  const dummy = useRef();
  const messageInput = useRef();
  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(20));

  const [messages] = useCollectionData(q);

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    if(await isUserBanned(auth.currentUser.email) === true){
      return auth.currentUser && (
        auth.signOut() && alert("You are banned from this chat.") && window.location.reload()       
      );
    }

    if(uid === adminID && auth.currentUser.email === adminEmail && formValue.startsWith("/ban")) {
      let userToBan = formValue.split(' ')[1];
      let banReason = formValue.split(' ')[2] || "Not_Provided";
      if(userToBan == null){
        alert("Provide valid message ID!");
        return;
      }else{
        let msgID = formValue.split(' ')[1];
        const docRef = doc(db, "messages", msgID);
        const docSnap = await getDoc(docRef);
        if(docSnap.data() === null || docSnap.data() === undefined){
          alert("Wrong message ID.")
          setFormValue('');
          return;
        }
        if(docSnap.data().uid === "System"){
          alert("You can't ban system silly.");
          setFormValue('');
          return;
        }
        const banRef = doc(db, "bannedUsers", docSnap.data().uid);
        await setDoc(banRef, {
          email: docSnap.data().email,
          reason: banReason
        })

        await addDoc(messagesRef, {
          uid: "System",
          email: "main@system.com",
          photoURL: "https://media.discordapp.net/attachments/939918273372385320/1024440498447974500/sys.png",
          text: "[SYSTEM] Admin just banned user " + docSnap.data().uid + ". Reason: " + banReason,
          createdAt: serverTimestamp(),
          msgID: doc(collection(db, "messages")).id
        })
        setFormValue('');
        return;
      }
    }

    if(uid === adminID && auth.currentUser.email === adminEmail && formValue.startsWith("/unban")) {
      let userToUnBan = formValue.split(' ')[1];
      if(userToUnBan == null){
        alert("Provide valid message ID!");
        return;
      }else{
        let msgIDtoUnban = formValue.split(' ')[1];
        const docRef = doc(db, "messages", msgIDtoUnban);
        const docSnap = await getDoc(docRef);
        if(docSnap.data() === null || docSnap.data() === undefined){
          alert("Wrong message ID.")
          setFormValue('');
          return;
        }
        await deleteDoc(doc(db, "bannedUsers", docSnap.data().msgID));

        await addDoc(messagesRef, {
          uid: "System",
          email: "main@system.com",
          photoURL: "https://media.discordapp.net/attachments/939918273372385320/1024440498447974500/sys.png",
          text: "[SYSTEM] Admin just unbanned user " + docSnap.data().uid + ".",
          createdAt: serverTimestamp(),
          msgID: doc(collection(db, "messages")).id
        })
        setFormValue('');
        return;
      }
    }

    await addDoc(messagesRef, {
      uid,
      email: auth.currentUser.email,
      photoURL,
      text: formValue,
      createdAt: serverTimestamp()
    }).then(docRef => {
      const msgRef = doc(db, "messages", docRef.id);
      updateDoc(msgRef, {
        msgID: docRef.id
      });
  })
  .catch(error => console.error("Error adding document: ", error))

    messageInput.current.focus();
    setFormValue('');
  }

  useEffect(() => {
    dummy.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (<>
      <main>
      {messages && messages.slice(0).reverse().map((msg, idx) => <ChatMessage key={idx} message={msg} />)}
      <div ref={dummy}/>
      </main>

      <form onSubmit={sendMessage}>
      <input ref={messageInput} value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Enter a message to send" />
      <button type="submit" disabled={!formValue || formValue.replace(/^\s+/, '').replace(/\s+$/, '') === ''}>Send message</button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL, createdAt, msgID } = props.message;
  var sendTIme = new Date(createdAt * 1000).toLocaleTimeString();

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
       <img className='pfp' src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="User" referrerPolicy="no-referrer"/>  
      <p1>{text}<p>The message was sent at {sendTIme}</p><p>Message ID: {msgID}</p></p1>
    </div>
  )
}

export default App;
