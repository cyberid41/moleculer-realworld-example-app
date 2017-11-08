"use strict";

const ApiGateway = require("moleculer-web");
const { ForbiddenError, UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: http://moleculer.services/docs/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [{
			path: "/api",

			authorization: true,

			whitelist: [
				// Access to any actions in all services
				"*"
			],

			aliases: {
				"REST users": "users",
				"GET /user": "users.me",
				"PUT /user": "users.updateMyself",

				"REST articles": "articles"
			},

			cors: true,
			bodyParsers: {
				json: true,
				urlencoded: {
					extended: false
				}
			}
		}],

		assets: {
			folder: "./public"
		}

	},

	methods: {
		/**
		 * Authorize the request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		authorize(ctx, route, req) {
			let token;
			if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Token" ||
				req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
				token = req.headers.authorization.split(" ")[1];
			}

			return this.Promise.resolve(token)
				.then(token => {
					if (token) {
						// Verify JWT token
						return ctx.call("users.resolveToken", { token })
							.then(user => {
								if (user) {
									this.logger.info("Authenticated via JWT: ", user.username);
									ctx.meta.user = user;
								}
								return user;
							});
					}
				})
				.then(user => {
					if (req.$endpoint.action.auth == "required" && !user)
						return this.Promise.reject(new UnAuthorizedError());
				});
		},
	}
};
