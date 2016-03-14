const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('../config');

mongoose.connect(process.env.MONGOLAB || config.mongolab);

var userSchema = new Schema({
    email: String,
    name: String,
    username: String,
    profileImg: String,
    completedChats: Number,
    facebookId: Number,
    uniqueId: String,
    skills: Array,
    githubUrl: String
});

const User = mongoose.model('User', userSchema);

const featuredUsers = function(request, reply){
    User.find({})
        .sort({completedChats: -1})
        .exec(function(err, users){
            if (err){
                throw err;
            }
            if (users) {
                reply(users);
            } else {
                reply(false);
            }
    });
};

const getPublicUser = (request, reply) => {
    console.log('GETPUBLICUSER----------')
    const username = request.params.username;
    User.findOne({ username: username }, function(err, user){
        if (err){
            throw err;
            reply.redirect('/');
        }

        if (user) {
            reply(user);
        }
        else {
            reply(false);
        }
    });
}


const getUser = (request, reply) => {
    console.log('------- GET USER---------')
    if (request.auth.isAuthenticated) {
        console.log('request.auth.credentials: ', request.auth.credentials)
        const username = request.auth.credentials.username;
        console.log('username: ', username);
        User.findOne({ username: username }, function(err, user){
            if (err){
                throw err;
                reply.redirect('/');
            }

            if (user) {
                reply(user);
            }
            else {
                reply(false);
            }
        });
    }
}


const githubLogin = (request, reply) => {
    const payload = request.auth.credentials;
    console.log('request: ', request);
    if (request.auth.isAuthenticated) {
        const username = request.auth.credentials.profile.username;
        User.findOne({ username: username }, function(err, expert){
            if (err){
                throw err;
                reply.redirect('/');
            }

            if (expert) {
                request.auth.session.set(expert);
                reply.redirect('/');
            }

            else {
                var new_user = new User();
                new_user.name = payload.profile.displayName;
                new_user.email = payload.profile.email;
                new_user.username = payload.profile.username;
                new_user.skills = [];
                new_user.profileImg = payload.profile.raw.avatar_url;
                new_user.githubUrl = payload.profile.raw.url;
                new_user.completedChats = 0;
                new_user.uniqueId = 'github_' + payload.profile.id;
                request.auth.session.set(new_user);
                new_user.save( function(err, res) {
                    if (err){

                        throw error;
                    }
                    reply.redirect('/');
                });
            }
        });
    } else {
        return reply('Not logged in...').code(401);
    }
}

const logout = (request, reply) => {
    request.auth.session.clear();
    reply.redirect('/');
}

module.exports = {
	featuredUsers: featuredUsers,
    githubLogin: githubLogin,
    getUser: getUser,
    getPublicUser: getPublicUser,
    logout: logout
};