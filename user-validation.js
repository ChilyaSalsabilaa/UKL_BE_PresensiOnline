const Joi = require(`joi`)

const validateUser = (request, response, next) => {
    const rules = Joi
        .object()
        .keys({
            name: Joi.string().required(),
            username: Joi.string().required(),
            password: Joi.string().required(),
            role: Joi.string().required()
        })
        .options({ abortEarly: false })

    let {error} = rules.validate(request.body)

    if (error != null) {
        let errMessage = error.details.map(it => it.message). join(",")

        return response.status(422).json({
            success: false,
            message: errMessage
        })
    }
    next()
}

module.exports = {validateUser}