const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Game = require("../models/gameModel");
const mongoose = require("mongoose");
const toId = mongoose.Types.ObjectId;

// @desc    Create new game
// @route   POST /api/games/create
// @access  Private
const createGame = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Enter a email");
  }
  // check if user plays game by itself
  if (req.user.email === email) {
    res.status(400);
    throw new Error("Enter other user email");
  }

  // Check if other user doesn't exists
  const otherUser = await User.findOne({ email });

  if (!otherUser) {
    res.status(400);
    throw new Error("User doesn't exists");
  }

  //already in other game with same user or not
  const otherGamewithSameUser = await Game.find({
    $and: [
      {
        $or: [
          { $and: [{ player1: req.user.id }, { player2: otherUser._id }] },
          { $and: [{ player2: req.user.id }, { player1: otherUser._id }] },
        ],
      },
      { status: 0 },
    ],
  });

  if (otherGamewithSameUser.length > 0) {
    res.status(400);
    throw new Error("Already, game is created");
  }

  // Create game
  const game = await Game.create({
    currentGame: Array(9).fill(""),
    currentChance: req.user.id,
    status: 0,
    player1: req.user.id,
    player2: otherUser._id,
  });

  if (game) {
    res.status(201).json(game);
  } else {
    res.status(400);
    throw new Error("Invalid game data");
  }
});

// @desc    Update a game
// @route   PUT /api/games/update/:id
// @access  Private
const updateGame = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(400);
    throw new Error("Game not found");
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  // Make sure the current chance player play a game
  if (game.currentChance.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Wait for next player to move!");
  }

  const result = checkResult(req.body.currentGame);

  if (result === "PENDING") {
    game.currentGame = req.body.currentGame;
    game.status = 0;
    if (game.currentChance.equals(game.player1)) {
      game.currentChance = game.player2;
    } else {
      game.currentChance = game.player1;
    }
    game.save();
  } else if (result === "DRAW") {
    game.currentGame = req.body.currentGame;
    game.status = -1;
    game.save();
  } else {
    game.currentGame = req.body.currentGame;
    game.status = 1;
    game.winner = toId(result);
    game.save();
  }

  const populatedGame = await Game.findById(req.params.id).populate("User");
  return res.status(201).json(populatedGame);
});

// @desc    Get a game
// @route   GET /api/games/:id
// @access  Private
const getGame = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate({ path: "player1", select: "_id name username email" })
    .populate({ path: "player2", select: "_id name username email" })
    .populate({ path: "winner", select: "_id name username email" });
  res.status(200).json(game);
});

// @desc    Get all games
// @route   GET /api/games
// @access  Private
const getAllGames = asyncHandler(async (req, res) => {
  const games = await Game.find({
    $or: [{ player1: req.user.id }, { player2: req.user.id }],
  })
    .populate({ path: "player1", select: "_id name username email" })
    .populate({ path: "player2", select: "_id name username email" })
    .populate({ path: "winner", select: "_id name username email" });
  res.status(200).json(games);
});

// Result Logic
const checkResult = (arr) => {
  const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  //winning
  for (let logic of winConditions) {
    const [a, b, c] = logic;
    if (arr[a] !== "" && arr[a] === arr[b] && arr[a] === arr[c]) {
      return arr[a]; // return winnerID
    }
  }

  for (let item of arr) {
    if (item === "") {
      return "PENDING";
    }
  }

  return "DRAW";
};

module.exports = {
  createGame,
  updateGame,
  getGame,
  getAllGames,
};
