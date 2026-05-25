import { query, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

function insertDb() {
  const users = getDocs(query(collection(db, 'user')))
  console.log(users)

  // getDocs(users)
  //   .then((doc) => {
  //     console.log(doc.data())
  //   })
  //   .catch((error) => {
  //     console.log(error)
  //   })
}

export { insertDb }
