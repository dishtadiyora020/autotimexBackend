import express from 'express'
import admin from './super-admin/index.js'
import garage from './garage/index.js'
import listing from './listing.js'
import common from './common.js'

const router = express.Router()

router.use('/admin', admin)
router.use('/garage', garage)
router.use('/listing', listing)
router.use('/common', common)

export default router;