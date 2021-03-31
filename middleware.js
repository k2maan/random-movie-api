exports.advanceQuerying = (model) => async (req, res, next) => {
    let query
    const reqQuery = { ...req.query }
    const removeFields = ["select", "page", "limit"]

    removeFields.forEach((param) => delete reqQuery[param])

    let queryStr = JSON.stringify(reqQuery)

    queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in)\b/g,
        (match) => `$${match}`
    )

    query = model.find(JSON.parse(queryStr), { _id: 0 })

    if (req.query.select) {
        const fields = req.query.select.split(",").join(" ")
        query = query.select(fields)
    }

    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    const results = await query

    const pagination = {}

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit,
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit,
        }
    }

    res.advanceQuerying = {
        status: true,
        count: results.count,
        pagination,
        data: results,
    }

    next()
}
