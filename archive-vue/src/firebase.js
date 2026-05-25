import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

import { firebaseConfig } from './config/firebaseConfig.js'

initializeApp(firebaseConfig)
const db = getFirestore()

export { db }
