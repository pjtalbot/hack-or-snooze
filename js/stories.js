'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
	// console.debug("generateStoryMarkup", story);

	let favIds = currentUser.favorites.map((a) => a.storyId);

	const hostName = story.getHostName();

	if (favIds.indexOf(`${story.storyId}`) === -1) {
		return $(`
      <li id="${story.storyId}">
      <small class="star">&#9734</small>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        
      </li>
    `);
	} else {
		return $(`
      <li id="${story.storyId}" class="favorite">
      <small class="star">&#9733</small>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        
      </li>
    `);
	}

	// <input class="star" type="checkbox">&#9734<input>
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putFavoritesOnPage() {
	$favoriteStoriesList.empty();
	for (let story of currentUser.favorites) {
		const $favorite = generateStoryMarkup(story);
		$favoriteStoriesList.append($favorite);
	}
	$favoriteStoriesList.show();
}

function putStoriesOnPage() {
	console.debug('putStoriesOnPage');
	$favoriteStoriesList.empty();

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		let favIds = currentUser.favorites.map((a) => a.storyId);

		if (favIds.indexOf(`${story.storyId}`) !== -1) {
			let star = document.getElementById(`${story.storyId}`);
			$(star).html('&9733');

			// $(star).html('&#9734');
			console.log('caught a favorite!');
			// console.log(story);
		}

		// HERE after favStoryId arr or obj is made, add if (favStoryId.index(story.storyId !== -1) etc.
		$allStoriesList.append($story);
	}
	// $('.star.favorite').html('&#9734');

	$allStoriesList.show();
}

function makeDeleteBtn() {
	return '<button class="delete-btn">Delete Story</button>';
}

async function deleteStory(e) {
	console.debug('deleteStory');

	const $deletedStory = $(e.target).closest('li');
	const storyId = $deletedStory.prop('id');

	await storyList.removeStory(currentUser, storyId);

	await putUserStoriesOnPage();
}
$ownStories.on('click', '.delete-btn', deleteStory);

// function darkenFavoriteStars() {
// 	for (let story of $allStoriesList) {
// 		if (story.hasClass('favorite')) {
// 			console.log('if this worked, darkenFavorite dit it');
// 			$('.star').html('&#9733');
// 		}
// 	}
// }

async function submitNewStory(e) {
	console.debug('submitNewStory');
	e.preventDefault();
	let title = document.getElementById('create-title').value;
	let author = document.getElementById('create-author').value;
	let userName = currentUser.username;
	let url = document.getElementById('create-url').value;

	let storyData = { title, url, author, userName };

	let story = await storyList.addStory(currentUser, storyData);

	const storyMarkup = generateStoryMarkup(story);

	$allStoriesList.prepend(storyMarkup);
	// currentUser.addOwnStory(story);

	$('#story-form').toggleClass('hidden');
	document.getElementById('story-form').reset();
}

function putUserStoriesOnPage() {
	$ownStories.empty();

	for (let story of currentUser.ownStories) {
		let storyMarkup = generateStoryMarkup(story, true);
		storyMarkup.prepend(makeDeleteBtn());
		$ownStories.prepend(storyMarkup);
	}

	$ownStories.show();
}

// function displayUserStars(story, user) {
// 	//
// }

async function handleStarClick(e) {
	let selected = $(e.target).parent();
	const storyId = selected.attr('id');
	const story = storyList.stories.find((s) => s.storyId === storyId);
	if (!selected.hasClass('favorite')) {
		$(e.target).html('&#9733');
		selected.addClass('favorite');
		await currentUser.addFav(story);
	} else {
		selected.removeClass('favorite');
		$(e.target).html('&#9734');
		await currentUser.removeFav(story);
		console.log(currentUser.favorites);
	}
}

$allStoriesList.on('click', '.star', handleStarClick);

$submitStoryButton.on('click', submitNewStory);

// async function toggleFavStory(e) {
// 	console.debug('toggleFavStory');

// 	const target = $(e.target);
// }
