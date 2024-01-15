const Follow = require("../models/follow");

const followUserIds = async (identityUserId) => {
  try {
    let following = await Follow.find({ user: identityUserId })
      .select({
        followed: 1,
        _id: 0,
      })
      .exec();

    let followers = await Follow.find({ followed: identityUserId })
      .select({
        user: 1,
        _id: 0,
      })
      .exec();

    let followingClean = [];

    following.forEach((follow) => {
      followingClean.push(follow.followed);
    });

    let followersClean = [];
    followers.forEach((follow) => {
      followersClean.push(follow.user);
    });

    return { following: followingClean, followers: followersClean };
  } catch {}
};

module.exports = { followUserIds };
