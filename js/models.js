'use strict';

const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
	/** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

	constructor({ storyId, title, author, url, username, createdAt }) {
		this.storyId = storyId;
		this.title = title;
		this.author = author;
		this.url = url;
		this.username = username;
		this.createdAt = createdAt;
	}

	/** Parses hostname out of URL and returns it. */

	getHostName() {
		// UNIMPLEMENTED: complete this function!
		return new URL(this.url).host;
	}
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
	constructor(stories) {
		this.stories = stories;
	}

	/** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

	static async getStories() {
		// Note presence of `static` keyword: this indicates that getStories is
		//  **not** an instance method. Rather, it is a method that is called on the
		//  class directly. Why doesn't it make sense for getStories to be an
		//  instance method?

		// Paul's answer: because you need to call getStories when creating the new instance of the StoryList story list class. the results of getStories are required to construct the object (or instance of) StoryList, so calling it on the INSTANCE wouldn't make logical sense.

		// query the /stories endpoint (no auth required)
		const response = await axios({
			url: `${BASE_URL}/stories`,
			method: 'GET'
		});

		// turn plain old story objects from API into instances of Story class
		const stories = response.data.stories.map((story) => new Story(story));

		// build an instance of our own class using the new array of stories
		return new StoryList(stories);
	}

	/** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

	async addStory(user, { title, author, url }) {
		console.log(user.loginToken);
		const token = user.loginToken;
		const response = await axios({
			method: 'POST',
			url: `${BASE_URL}/stories`,
			data: { token, story: { title, author, url } }
		});

		let story = new Story(response.data.story);
		this.stories.unshift(story);
		user.ownStories.unshift(story);

		return story;

		// UNIMPLEMENTED: complete this function!
	}

	async removeStory(user, storyId) {
		const token = user.loginToken;
		await axios({
			url: `${BASE_URL}/stories/${storyId}`,
			method: 'DELETE',
			data: { token: user.loginToken }
		});

		this.stories = this.stories.filter((story) => !(story.storyId === storyId));

		user.ownStories = user.ownStories.filter((story) => !(story.storyId === storyId));
		user.favorites = user.favorites.filter((story) => !(story.storyId === storyId));
	}
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
	/** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

	constructor({ username, name, createdAt, favorites = [], ownStories = [] }, token) {
		this.username = username;
		this.name = name;
		this.createdAt = createdAt;

		// instantiate Story instances for the user's favorites and ownStories
		this.favorites = favorites.map((s) => new Story(s));
		this.ownStories = ownStories.map((s) => new Story(s));

		// store the login token on the user so it's easy to find for API calls.
		this.loginToken = token;
	}

	/** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

	static async signup(username, password, name) {
		const response = await axios({
			url: `${BASE_URL}/signup`,
			method: 'POST',
			data: { user: { username, password, name } }
		});

		let { user } = response.data;

		return new User(
			{
				username: user.username,
				name: user.name,
				createdAt: user.createdAt,
				favorites: user.favorites,
				ownStories: user.stories
			},
			token
		);
	}

	/** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

	static async login(username, password) {
		const response = await axios({
			url: `${BASE_URL}/login`,
			method: 'POST',
			data: { user: { username, password } }
		});

		const { user } = response.data;

		return new User(
			{
				username: user.username,
				name: user.name,
				createdAt: user.createdAt,
				favorites: user.favorites,
				ownStories: user.stories
			},
			response.data.token
		);
	}

	/** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

	static async loginViaStoredCredentials(token, username) {
		try {
			const response = await axios({
				url: `${BASE_URL}/users/${username}`,
				method: 'GET',
				params: { token }
			});

			let { user } = response.data;

			return new User(
				{
					username: user.username,
					name: user.name,
					createdAt: user.createdAt,
					favorites: user.favorites,
					ownStories: user.stories
				},
				token
			);
		} catch (err) {
			console.error('loginViaStoredCredentials failed', err);
			return null;
		}
	}

	async clearAllFavorites() {
		console.debug(clearAllFavorites);
		this.favorites = [];
	}

	async addFav(story) {
		console.log(story);
		this.favorites.push(story);
		console.log(this.favorites);
		let token = this.loginToken;

		await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
			method: 'POST',
			data: { token }
		});
	}

	async addOwnStory(story) {
		this.ownStories.push(story);
		let token = this.loginToken;

		await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
			method: 'POST',
			data: { token }
		});
	}

	async removeFav(story) {
		let userFavs = this.favorites;
		let token = this.loginToken;
		// userFavs.filter((s) => s.storyId !== story.storyId);

		for (let i = 0; i < userFavs.length; i++) {
			if (story.storyId === userFavs[i].storyId) {
				await axios({
					url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
					method: 'DELETE',
					data: { token }
				});
				userFavs.splice(i, 1);
			}
		}
	}
}
