pragma solidity ^0.5.0;

contract CryptoMind {
  /*
  bounty: the wei each player must pay before join game
  owner: who create the game
  roomSize: number players in room
  blockStart: when starting game
  blockTimeout: amount block from start to finish
  highscore: highest score among players
  submited: address array of players submited their answers
  players: address array of players
  answers: address of player => their score
*/
  struct Room {
    uint256 bounty;
    address owner;
    uint256 roomSize;
    uint256 result;
    uint256 blockStart;
    uint256 blockTimeout;
    uint256 highscore;
    address payable[] submited;
    address payable[] players;
    mapping(address => uint256) answers;
  }

  uint256 FEE_AMOUNT = 5;

  address public manager;
  Room[] public rooms;
  uint256[] public waitingRoom;
  mapping(address => uint256) public playerRoom;
  uint256 public withdrawableBalance;

  event StartGame(uint256 indexed roomId, uint256 seed, uint256 blockStart, uint256 blockTimeout);
  event JoinRoom(uint256 indexed roomId, address newPlayer);
  event QuitRoom(uint256 indexed roomId, address quitPlayer);

  constructor() public {
    manager = msg.sender;
    address payable[] memory players;
    address payable[] memory submited;
    rooms.push(Room(0, address(0x00), 0, 2, 0, 0, 0, submited, players));
  }

  modifier onlyOwner() {
    require(msg.sender == manager);
    _;
  }

  function lastGameTimeOut(uint256 _roomId) internal view returns (bool) {
    Room storage currentRoom = rooms[_roomId];
    return
      block.number > currentRoom.blockStart + currentRoom.blockTimeout &&
      currentRoom.blockStart != 0;
  }

  function leftOngoingGame(uint256 _roomId) internal view returns (bool) {
    Room storage currentRoom = rooms[_roomId];
    return playerRoom[msg.sender] != 0 && currentRoom.result == 0;
  }

  function createRoom(uint256 _bounty, uint256 _roomSize, uint256 blockTimeout) external payable {
    uint256 roomId = playerRoom[msg.sender];
    Room storage currentRoom = rooms[roomId];
    if (leftOngoingGame(roomId)) {
      if (lastGameTimeOut(roomId)) {
        claimReward();
      } else {
        submitAnswer(0);
      }
    }
    require(msg.value >= _bounty, 'must send value more than bounty');
    require(
      _roomSize > 1 && _roomSize < 20,
      'must more than 1 players in room and less than 20 players'
    );
    require(
      playerRoom[msg.sender] == 0 || currentRoom.result > 0 || lastGameTimeOut(roomId),
      'quit previous room or previousRoom submited or playerRoom timeup before join new game'
    );
    address payable[] memory players;
    address payable[] memory submited;

    rooms.push(Room(_bounty, msg.sender, _roomSize, 0, 0, blockTimeout, 0, submited, players));
    Room storage room = rooms[rooms.length - 1];
    room.players.push(msg.sender);
    playerRoom[msg.sender] = rooms.length - 1;
    waitingRoom.push(rooms.length - 1);
  }

  function removeFromWatingRoom(uint256 _roomId) internal {
    for (uint256 i = 0; i < waitingRoom.length; i++) {
      if (waitingRoom[i] == _roomId) {
        waitingRoom[i] = waitingRoom[waitingRoom.length - 1];
        waitingRoom.pop();
        break;
      }
    }

  }

  function removePlayerInWaitingRoom(uint256 _roomId, address _player) internal {
    Room storage room = rooms[_roomId];
    address(uint160(_player)).transfer(room.bounty);
    for (uint256 i = 0; i < room.players.length; i++) {
      if (_player == room.players[i]) {
        room.players[i] = room.players[room.players.length - 1];
        room.players.pop();
        playerRoom[_player] = 0;
        break;
      }
    }
    if (room.players.length == 0) {
      room.result = 2;
    }
  }

  function removePlayerInRunningRoom(uint256 _roomId, address _player) internal {
    Room storage room = rooms[_roomId];
    if (!inArray(_player, room.submited)) {
      submitAnswer(0);
    }
    playerRoom[_player] = 0;
  }

  function joinRoom(uint256 _roomId) external payable {
    require(_roomId < rooms.length, 'roomId must be less than rooms length');
    Room storage currentRoom = rooms[playerRoom[msg.sender]];
    if (leftOngoingGame(playerRoom[msg.sender])) {
      if (lastGameTimeOut(playerRoom[msg.sender])) {
        claimReward();
      } else {
        submitAnswer(0);
      }
    }
    require(
      playerRoom[msg.sender] == 0 ||
        currentRoom.result > 0 ||
        lastGameTimeOut(playerRoom[msg.sender]),
      'quit previous room or previousRoom submited or playerRoom timeup before join new game'
    );
    require(waitingRoom.length > 0, 'must more than one waiting room');
    Room storage newRoom = rooms[_roomId];
    require(
      newRoom.players.length < newRoom.roomSize,
      'players in room must be less than roomSize'
    );
    require(msg.value >= newRoom.bounty);
    newRoom.players.push(msg.sender);
    playerRoom[msg.sender] = _roomId;
    emit JoinRoom(_roomId, msg.sender);
    if (newRoom.players.length == newRoom.roomSize) {
      removeFromWatingRoom(_roomId);
      startGame(_roomId);
    }
  }

  function startGame(uint256 _roomId) internal {
    Room storage room = rooms[_roomId];
    require(room.players.length == room.roomSize, 'room must be full');
    room.blockStart = block.number;
    emit StartGame(
      _roomId,
      uint256(block.timestamp) ^ uint256(blockhash(block.number - 1)),
      room.blockStart,
      room.blockTimeout
    );
  }

  function submitAnswer(uint256 result) public {
    uint256 roomId = playerRoom[msg.sender];
    Room storage room = rooms[roomId];
    uint256 currentBlock = block.number;
    require(!inArray(msg.sender, room.submited), 'player only submit one time');
    require(room.blockStart != 0, 'room must be started');
    require(room.result == 0, 'Room must not share bounty');
    require(currentBlock <= room.blockStart + room.blockTimeout, 'Submiting must be in time');
    require(currentBlock > room.blockStart, 'Submitting must be after startGame');
    if (result > room.highscore) {
      room.highscore = result;
    }
    room.answers[msg.sender] = result;
    room.submited.push(msg.sender);
    if (room.submited.length == room.roomSize) {
      shareBounty(roomId);
    }
  }

  function roomOf(address _player)
    external
    view
    returns (
      uint256 roomId,
      uint256 bounty,
      address owner,
      uint256 roomSize,
      uint256 result,
      uint256 blockStart,
      uint256 blockTimeout,
      address payable[] memory players,
      address payable[] memory submited,
      uint256 highscore
    )
  {
    roomId = playerRoom[_player];
    Room storage room = rooms[roomId];
    bounty = room.bounty;
    owner = room.owner;
    roomSize = room.roomSize;
    result = room.result;
    blockStart = room.blockStart;
    blockTimeout = room.blockTimeout;
    players = room.players;
    submited = room.submited;
    highscore = room.highscore;
  }

  function roomById(uint256 _roomId)
    external
    view
    returns (
      uint256 roomId,
      uint256 bounty,
      address owner,
      uint256 roomSize,
      uint256 result,
      uint256 blockStart,
      uint256 blockTimeout,
      address payable[] memory players,
      address payable[] memory submited,
      uint256 highscore
    )
  {
    require(_roomId < rooms.length, 'roomId must be less than rooms length');
    Room storage room = rooms[_roomId];
    roomId = _roomId;
    bounty = room.bounty;
    owner = room.owner;
    roomSize = room.roomSize;
    result = room.result;
    blockStart = room.blockStart;
    blockTimeout = room.blockTimeout;
    players = room.players;
    submited = room.submited;
    highscore = room.highscore;
  }

  function getAnswerInRoom(address _player, uint256 _roomId)
    external
    view
    returns (uint256 answer)
  {
    Room storage room = rooms[_roomId];
    answer = room.answers[_player];
  }

  function claimReward() internal {
    uint256 roomId = playerRoom[msg.sender];
    require(lastGameTimeOut(roomId), 'claimReward only executed after time up');
    shareBounty(roomId);
  }

  function shareBounty(uint256 roomId) internal {
    Room storage room = rooms[roomId];
    if (room.highscore == 0) {
      room.result = 1;
      withdrawableBalance += room.bounty * room.roomSize;
      return;
    }
    uint256 totalBounty = (room.bounty * room.roomSize * (100 - FEE_AMOUNT)) / 100;
    withdrawableBalance += room.bounty * room.roomSize - totalBounty;
    uint8 winnerCount = 0;

    //Find winners
    for (uint256 i = 0; i < room.players.length; i++) {
      if (room.answers[room.players[i]] == room.highscore) {
        winnerCount++;
      }
    }

    for (uint256 i = 0; i < room.players.length; i++) {
      if (room.answers[room.players[i]] == room.highscore) {
        room.players[i].transfer(totalBounty / winnerCount);
      }
    }

    room.result = 1;
  }

  function inArray(address player, address payable[] memory arr) private pure returns (bool) {
    bool inArr = false;
    for (uint256 i = 0; i < arr.length; i++) {
      if (player == arr[i]) {
        inArr = true;
        break;
      }
    }
    return inArr;
  }

  function quitGame() external {
    address player = msg.sender;
    uint256 roomId = playerRoom[player];
    Room storage room = rooms[roomId];
    require(roomId > 0, 'roomId must be greater than 0');
    if (room.blockStart > 0) {
      removePlayerInRunningRoom(roomId, player);
    } else {
      emit QuitRoom(roomId, player);
      removePlayerInWaitingRoom(roomId, player);
      if (room.players.length == 0) {
        removeFromWatingRoom(roomId);
      }
    }
  }

  function withdraw(uint256 amount) external onlyOwner {
    require(amount <= withdrawableBalance, 'amount withdraw must be less than withdrawableBalance');
    msg.sender.transfer(amount);
    withdrawableBalance -= amount;
  }

  function getWaitingRoom() public view returns (uint256[] memory arr) {
    return waitingRoom;
  }

  function getPlayerRoom(uint256 roomId) public view returns (address payable[] memory) {
    return rooms[roomId].players;
  }

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function adjustFee(uint256 newFee) external onlyOwner {
    require(newFee < 100 && newFee > 0, 'newFee must be between 0 and 100');
    FEE_AMOUNT = newFee;
  }

  function() external payable {}
}
