/* === Imports === */
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where,
    orderBy,
    updateDoc,
    doc,
    deleteDoc,
    // getDocs,
} from "firebase/firestore";

/* === Firebase Setup === */
const firebaseConfig = {
    apiKey: "AIzaSyB5f6SNIi1qSedtGpJx_I3SZq6beDNQuG0",
    authDomain: "moody-b0daa.firebaseapp.com",
    projectId: "moody-b0daa",
    storageBucket: "moody-b0daa.firebasestorage.app",
    messagingSenderId: "505062944671",
    appId: "1:505062944671:web:a49b66253cd21e5ab957aa"
};

// Initialize Firebase
const collectionName = "posts"
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Initialize Firebase Authentication and get a reference to the service
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const signOutButtonEl = document.getElementById("sign-out-btn")
const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")
const displayNameInputEl = document.getElementById("display-name-input")
// const photoURLInputEl = document.getElementById("photo-url-input")
// const updateProfileButtonEl = document.getElementById("update-profile-btn")

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")
// const fetchPostsButtonEl = document.getElementById("fetch-posts-btn")

const allFilterButtonEl = document.getElementById("all-filter-btn")

const filterButtonEls = document.getElementsByClassName("filter-btn")

const postsEl = document.getElementById("posts")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)


signOutButtonEl.addEventListener("click", authSignOut)
// updateProfileButtonEl.addEventListener("click", authUpdateProfile)

for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.addEventListener("click", selectMood)
}

for (let filterButtonEl of filterButtonEls) {
    filterButtonEl.addEventListener("click", selectFilter)
}

postButtonEl.addEventListener("click", postButtonPressed)

// fetchPostsButtonEl.addEventListener("click", fetchOnceAndRenderPostsFromDB)


/* === State === */

let moodState = 0
/* === Main Code === */

// after loggin in Auth changes and this is the one that shows
onAuthStateChanged(auth, (user) => {
    if (user) {
        showLoggedInView()
        showProfilePicture(userProfilePictureEl, user)
        showUserGreeting(userGreetingEl, user)
        // fetchInRealtimeAndRenderPostsFromDB(user)
    } else {
        showLoggedOutView()
    }
});



/* === Functions === */
function postButtonPressed() {
    const postBody = textareaEl.value
    const user = auth.currentUser
    if (postBody && moodState) {
        addPostToDB(postBody, user)
        clearInputField(textareaEl)
        resetAllMoodElements(moodEmojiEls)
    }
}
/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            // IdP data available using getAdditionalUserInfo(result)
            // ...
            console.log("Logged with google")
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
            console.error(errorCode)
            console.error(errorMessage)

        });
}

function authSignInWithEmail() {
    const email = emailInputEl.value
    const password = passwordInputEl.value
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            clearAuthFields()
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorCode)
            console.error(errorMessage)
        });
}


function authSignOut() {
    signOut(auth).then(() => {
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode)
        console.error(errorMessage)
    });


}

function authCreateAccountWithEmail() {
    const email = emailInputEl.value
    const password = passwordInputEl.value
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            clearAuthFields()
            showLoggedInView()
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorCode)
            console.error(errorMessage)
        });
}

function authUpdateProfile() {
    const newData = {}
    if (displayNameInputEl) {
        newData.displayName = displayNameInputEl.value
    }
    if (photoURLInputEl) {
        newData.photoURL = photoURLInputEl.value
    }

    updateProfile(auth.currentUser, newData).then(() => {
        console.log("Profile Updated")
    }).catch((error) => {
        // An error occurred
        // ...
        console.error(error.message)
    });

}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody, user) {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            body: postBody,
            uid: user.uid,
            //timezones gives headache
            createdAt: serverTimestamp(),
            mood: moodState
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }

}

async function updatePostInDB(docId, newBody) {
    const postRef = doc(db, collectionName, docId)
    await updateDoc(postRef, {
        body: newBody,
        createdAt: serverTimestamp()
    })
}

async function deletePostFromDB(docId) {
    await deleteDoc(doc(db, collectionName, docId));

}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
    const selectedMoodEmojiElementId = event.currentTarget.id

    changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls)

    const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)

    moodState = chosenMoodValue
}
function changeMoodsStyleAfterSelection(selectedMoodElementId, allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        if (selectedMoodElementId === moodEmojiEl.id) {
            moodEmojiEl.classList.remove("unselected-emoji")
            moodEmojiEl.classList.add("selected-emoji")
        } else {
            moodEmojiEl.classList.remove("selected-emoji")
            moodEmojiEl.classList.add("unselected-emoji")
        }
    }
}

function resetAllMoodElements(allMoodElements) {
    for (let moodEmojiEl of allMoodElements) {
        moodEmojiEl.classList.remove("selected-emoji")
        moodEmojiEl.classList.remove("unselected-emoji")
    }

    moodState = 0
}

function returnMoodValueFromElementId(elementId) {
    return Number(elementId.slice(5))
}

/* == Functions - UI Functions == */

function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex"
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field) {
    field.value = ""
}

function clearAll(element) {
    element.innerHTML = ""
}

function clearAuthFields() {
    clearInputField(emailInputEl)
    clearInputField(passwordInputEl)
}

function showProfilePicture(imgElement, user) {
    if (user !== null) {
        // The user object has basic properties such as display name, email, etc.
        const displayName = user.displayName;
        const email = user.email;
        const photoURL = user.photoURL;
        const emailVerified = user.emailVerified;

        // The user's ID, unique to the Firebase project. Do NOT use
        // this value to authenticate with your backend server, if
        // you have one. Use User.getToken() instead.
        const uid = user.uid;
        imgElement.src = "assets/images/default_profile_picture.jpeg"
        if (photoURL != null) {
            imgElement.src = photoURL
            console.log(photoURL)
        }

    }
}
function showUserGreeting(element, user) {
    if (user !== null) {
        // The user object has basic properties such as display name, email, etc.
        const displayName = user.displayName;
        const email = user.email;
        const photoURL = user.photoURL;
        const emailVerified = user.emailVerified;

        // The user's ID, unique to the Firebase project. Do NOT use
        // this value to authenticate with your backend server, if
        // you have one. Use User.getToken() instead.
        element.textContent = "Hey Friend! How you doing?"
        const uid = user.uid;
        if (displayName) {
            element.textContent = "Hey " + displayName.split(" ")[0] + "! How you doing?"
        }
    }
}


// async function fetchOnceAndRenderPostsFromDB() {
//     const querySnapshot = await getDocs(collection(db, "posts"));
//     clearAll(postsEl)
//     querySnapshot.forEach((doc) => {
//         // doc.data() is never undefined for query doc snapshots
//         renderPost(postsEl, doc.data())
//     });

// }

function fetchInRealtimeAndRenderPostsFromDB(query, user) {
    onSnapshot(query, (querySnapshot) => {
        clearAll(postsEl)
        querySnapshot.forEach((doc) => {
            renderPost(postsEl, doc)
        })

    })
}

function createPostHeader(postData) {
    const headerDiv = document.createElement("div")
    headerDiv.className = "header"

    const headerDate = document.createElement("h3")
    headerDate.textContent = displayDate(postData.createdAt)
    headerDiv.appendChild(headerDate)

    const moodImage = document.createElement("img")
    moodImage.src = `assets/emojis/${postData.mood}.png`
    headerDiv.appendChild(moodImage)
    return headerDiv
}

function createPostBody(postData) {
    const postBody = document.createElement("p")
    postBody.innerHTML = replaceNewlinesWithBrTags(postData.body)
    return postBody
}

function createPostUpdateButton(doc) {
    /* 
        <button class="edit-color">Edit</button>
    */
    const postId = doc.id
    const postData = doc.data()
    const button = document.createElement("button")
    button.textContent = "Edit"
    button.classList.add("edit-color")
    button.addEventListener("click", function () {
        console.log("Edit button clicked")
        const newBody = prompt("Edit the post", postData.body)
        if (newBody) {
            updatePostInDB(postId, newBody)
        }
    })

    return button
}
function createPostDeleteButton(wholeDoc) {
    const postId = wholeDoc.id

    /* 
        <button class="delete-color">Delete</button>
    */
    const button = document.createElement('button')
    button.textContent = 'Delete'
    button.classList.add("delete-color")
    button.addEventListener('click', function () {
        console.log("Delete post")
        deletePostFromDB(postId)
    })
    return button
}

function createPostFooter(wholeDoc) {
    /* 
        <div class="footer">
            <button>Edit</button>
            <button>Delete</button>
        </div>
    */
    const footerDiv = document.createElement("div")
    footerDiv.className = "footer"

    footerDiv.appendChild(createPostUpdateButton(wholeDoc))
    footerDiv.appendChild(createPostDeleteButton(wholeDoc))

    return footerDiv
}

function renderPost(postsEl, wholeDoc) {
    const postData = wholeDoc.data()

    const postDiv = document.createElement("div")
    postDiv.className = "post"

    postDiv.appendChild(createPostHeader(postData))
    postDiv.appendChild(createPostBody(postData))
    postDiv.appendChild(createPostFooter(wholeDoc))

    postsEl.appendChild(postDiv)
}

function replaceNewlinesWithBrTags(inputString) {
    return inputString.replace(/[\r\n]/g, "<br>");
}

function displayDate(firebaseDate) {
    if (!firebaseDate) {
        return "Date processing"
    }

    const date = firebaseDate.toDate()

    const day = date.getDate()
    const year = date.getFullYear()

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]

    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${day} ${month} ${year} - ${hours}:${minutes} `
}

function resetAllFilterButtons(allFilterButtons) {
    for (let filterButtonEl of allFilterButtons) {
        filterButtonEl.classList.remove("selected-filter")
    }
}

function updateFilterButtonStyle(element) {
    element.classList.add("selected-filter")
}

function fetchPostsFromPeriod(period, user) {
    if (period === "today") {
        fetchTodayPosts(user)
    } else if (period === "week") {
        fetchWeekPosts(user)
    } else if (period === "month") {
        fetchMonthPosts(user)
    } else if (period === "all") {
        fetchAllPosts(user)
    }
}


function selectFilter(event) {
    const user = auth.currentUser

    const selectedFilterElementId = event.target.id

    const selectedFilterPeriod = selectedFilterElementId.split("-")[0]

    const selectedFilterElement = document.getElementById(selectedFilterElementId)

    resetAllFilterButtons(filterButtonEls)

    updateFilterButtonStyle(selectedFilterElement)
    fetchPostsFromPeriod(selectedFilterPeriod, user)
}

function fetchTodayPosts(user) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0) //Midnight

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)
    const q = query(postsRef, where("uid", "==", user.uid)
        , where("createdAt", ">=", startOfDay)
        , where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"))
    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

function fetchWeekPosts(user) {
    const startOfWeek = new Date()
    startOfWeek.setHours(0, 0, 0, 0)
    if (startOfWeek.getDay() === 0) {
        startOfWeek.setDate(startOfWeek.getDate() - 6)
    } else {
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
    }
    const endOfDate = new Date()
    endOfDate.setHours(23, 59, 59, 999)
    const postsRef = collection(db, collectionName)
    const q = query(postsRef, where("uid", "==", user.uid)
        , where("createdAt", ">=", startOfWeek)
        , where("createdAt", "<=", endOfDate),
        orderBy("createdAt", "desc"))
    fetchInRealtimeAndRenderPostsFromDB(q, user)

}

function fetchMonthPosts(user) {
    const startOfMonth = new Date()
    startOfMonth.setHours(0, 0, 0, 0)
    startOfMonth.setDate(1)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where("uid", "==", user.uid),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

function fetchAllPosts(user) {
    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where("uid", "==", user.uid),
        orderBy("createdAt", "desc"))
    fetchInRealtimeAndRenderPostsFromDB(q, user)
}