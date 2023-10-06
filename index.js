import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, get, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://realtime-database-1cc85-default-rtdb.asia-southeast1.firebasedatabase.app/"
}
const app = initializeApp(appSettings)
const database = getDatabase(app)
const ximbaInDB = ref(database, "ximba")
let likedTweets = []
let retweetedTweets = []
let username = localStorage.getItem('username')
if(username){
    document.getElementById("username-input").value = username
    document.getElementById("profile-pic").src = 'https://source.boringavatars.com/beam/120/' + username
}

document.addEventListener('click', function(e){
    if(e.target.dataset.like){
       handleLikeClick(e.target.dataset.like)
    }
    else if(e.target.dataset.retweet){
        handleRetweetClick(e.target.dataset.retweet)
    }
    else if(e.target.dataset.reply){
        handleReplyClick(e.target.dataset.reply)
    }
    else if(e.target.id === 'tweet-btn'){
        handleTweetBtnClick()
    }
    else if(e.target.id === 'username-btn'){
        handleUsernameBtnClick()
    }
    else if(e.target.dataset.replyBtn){
        handleReplyBtnClick(e.target.dataset.replyBtn)
    }
})

document.addEventListener('keypress', function(e){
    if((e.target.id === 'tweet-input' || e.target.dataset.replyInput) && !localStorage.getItem('username')){
        e.preventDefault()
        alert('Please enter your username')
    }
})
 
function handleLikeClick(tweetId){
    let likesCountInDB = ref(database, `ximba/${tweetId}/likes`)
    get(likesCountInDB).then(function(snapshot){
        let likeCount = snapshot.val()
        likedTweets = JSON.parse(localStorage.getItem('likedStorage'))
        if(!likedTweets || !likedTweets.includes(tweetId)){
            likeCount += 1
            !likedTweets ? likedTweets = [] : null
            likedTweets.push(tweetId)
        } else {
            likeCount -= 1
            likedTweets.splice(likedTweets.indexOf(tweetId),1)
        }
        localStorage.setItem('likedStorage', JSON.stringify(likedTweets))
        set(likesCountInDB, likeCount)
        let statusEl = document.querySelector(`[data-like="${tweetId}"]`)
        statusEl.classList.toggle("liked")
    })
}

function handleRetweetClick(tweetId){
    let retweetsCountInDB = ref(database, `ximba/${tweetId}/retweets`)
    get(retweetsCountInDB).then(function(snapshot){
        let retweetCount = snapshot.val()
        retweetedTweets = JSON.parse(localStorage.getItem('retweetedStorage'))
        if(!retweetedTweets || !retweetedTweets.includes(tweetId)) {
            retweetCount += 1
            !retweetedTweets ? retweetedTweets = [] : null
            retweetedTweets.push(tweetId)
        } else {
            retweetCount -= 1
            retweetedTweets.splice(retweetedTweets.indexOf(tweetId),1)
        }
        localStorage.setItem('retweetedStorage', JSON.stringify(retweetedTweets))
        set(retweetsCountInDB, retweetCount)
        let statusEl = document.querySelector(`[data-retweet="${tweetId}"]`)
        statusEl.classList.toggle("retweeted")
    })
}

function handleReplyClick(replyId){
    if(document.getElementById(`replies-${replyId}`).classList.length === 2){
        get(ximbaInDB).then(function(snapshot){
            document.getElementById('feed').innerHTML = getFeedHtml(snapshot)
            document.getElementById(`replies-${replyId}`).classList.toggle('hidden')
        })
    }
    else {
        document.getElementById(`replies-${replyId}`).classList.toggle('hidden')
    }
}

function handleTweetBtnClick(){
    const tweetInput = document.getElementById('tweet-input')
    if(tweetInput.value){
        var escape = document.createElement('textarea')
        escape.textContent = tweetInput.value
        let inputValue = {
            handle: `@${username}`,
            profilePic: `https://source.boringavatars.com/beam/120/${username}`,
            tweetText: escape.innerHTML,
            likes: 0,
            retweets: 0
        }
        push(ximbaInDB, inputValue)
        tweetInput.value = ''
    }
    get(ximbaInDB).then(function(snapshot){
        document.getElementById('feed').innerHTML = getFeedHtml(snapshot)
    })
}

function handleUsernameBtnClick(){
    username = document.getElementById("username-input").value
    localStorage.setItem('username',username)
    document.getElementById("profile-pic").src = `https://source.boringavatars.com/beam/120/${username}`
    location.reload()
}

function handleReplyBtnClick(replyId){
    const replyInput = document.querySelector(`[data-reply-input="${replyId}"]`)
    let repliesInDB = ref(database, `ximba/${replyId}/replies`)
    if(replyInput.value){
        var escape = document.createElement('textarea')
        escape.textContent = replyInput.value
        get(repliesInDB).then(function(snapshot){
            let inputValue = snapshot.val()
            !inputValue ? inputValue = [] : null
            inputValue.push({
                handle: `@${username}`,
                profilePic: `https://source.boringavatars.com/beam/120/${username}`,
                tweetText: escape.innerHTML
            })
            set(repliesInDB, inputValue)
            replyInput.value = ''
            get(ximbaInDB).then(function(snapshot){
                document.getElementById('feed').innerHTML = getFeedHtml(snapshot)
                document.getElementById(`replies-${replyId}`).classList.toggle('hidden')
            })
        })
    }
}

function getFeedHtml(snapshot){
    if (snapshot.exists()) {
        let tweetsArray = Object.entries(snapshot.val())
        likedTweets = JSON.parse(localStorage.getItem('likedStorage'))
        retweetedTweets = JSON.parse(localStorage.getItem('retweetedStorage'))
        let feedHtml = `` 
        for (let i = tweetsArray.length-1; i >= 0; i--) {
            let uuid = tweetsArray[i][0]
            let tweet = tweetsArray[i][1]
            let repliesHtml = ``

            if(tweet.replies) {
                for (let j = 0; j < tweet.replies.length; j++) {
                    let reply = tweet.replies[j]
                    repliesHtml += `<div class="tweet-reply">
                                        <div class="tweet-inner">
                                            <img src="${reply.profilePic}" class="profile-pic">
                                                <div>
                                                    <p class="handle">${reply.handle}</p>
                                                    <p class="tweet-text">${reply.tweetText}</p>
                                                </div>
                                            </div>
                                    </div>`
                }
            }

            repliesHtml += `<div class="tweet-reply">
                                        <div class="tweet-inner">
                                            <img src="https://source.boringavatars.com/beam/120/${username}" class="profile-pic">
                                                <div>
                                                    <textarea placeholder="Post your reply" class="tweet-reply-input" maxlength="250" data-reply-input="${uuid}"></textarea>
                                                    <button class="reply-btn" data-reply-btn="${uuid}">Reply</button>
                                                </div>
                                            </div>
                                    </div>`
            
            feedHtml += `<div class="tweet">
                            <div class="tweet-inner">
                                <img src="${tweet.profilePic}" class="profile-pic">
                                <div>
                                    <p class="handle">${tweet.handle}</p>
                                    <p class="tweet-text">${tweet.tweetText}</p>
                                    <div class="tweet-details">
                                        <span class="tweet-detail">
                                            <i class="fa-regular fa-comment-dots" data-reply="${uuid}"></i>
                                            <span data-reply-count="${uuid}">${tweet.replies ? tweet.replies.length : 0}</span>
                                        </span>
                                        <span class="tweet-detail">
                                            <i class="fa-solid fa-heart ${likedTweets ? likedTweets.includes(uuid)?'liked':'' : 0}" data-like="${uuid}"></i>
                                            <span data-like-count="${uuid}">${tweet.likes}</span>
                                        </span>
                                        <span class="tweet-detail">
                                            <i class="fa-solid fa-retweet ${retweetedTweets ? retweetedTweets.includes(uuid)?'retweeted':'' : 0}" data-retweet="${uuid}"></i>
                                            <span data-retweet-count="${uuid}">${tweet.retweets}</span>
                                        </span>
                                    </div>   
                                </div>            
                            </div>
                            <div class="replies-div hidden" id="replies-${uuid}">
                                ${repliesHtml}
                            </div>   
                        </div>`
       }
       return feedHtml   
    }
    else {
        return `<div class="tweet"><div style="width: 160px; margin: 0 auto;">No 𝕏weets here... yet</div></div>`
    }
}

get(ximbaInDB).then(function(snapshot){
    document.getElementById('feed').innerHTML = getFeedHtml(snapshot)
    onValue(ximbaInDB, function(snapshot){
        updateCount(snapshot)
    })
})

function updateCount(snapshot){
    let tweetsArray = Object.entries(snapshot.val())
    likedTweets = JSON.parse(localStorage.getItem('likedStorage'))
    retweetedTweets = JSON.parse(localStorage.getItem('retweetedStorage'))
    tweetsArray.forEach(function(tweetKeyValue){
        let uuid = tweetKeyValue[0]
        let tweet = tweetKeyValue[1]
        document.querySelector(`[data-reply-count="${uuid}"]`).innerHTML = tweet.replies ? tweet.replies.length : 0
        document.querySelector(`[data-like-count="${uuid}"]`).innerHTML = tweet.likes
        document.querySelector(`[data-retweet-count="${uuid}"]`).innerHTML = tweet.retweets
    })
}