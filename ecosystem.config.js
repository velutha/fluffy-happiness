module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : "samChat",
      script    : "bin/www",
      instances : 2,
      exec_mode : "cluster",
      env: {
        PORT: 8080
      },
      env_production : {
        NODE_ENV: "production"
      }
    },

    // Second application
    //{
      //name      : "WEB",
      //script    : "web.js"
    //}
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : "ubuntu",
      host : "35.154.121.210",
      key: '~/.ssh/Samchat.pem',
      ref  : "origin/master",
      repo : "git@bitbucket.org:amithnf/samchat.git",
      path : "/home/ubuntu/samChat",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production"
    },
    staging : {
      user : "node",
      host : "212.83.163.1",
      ref  : "origin/master",
      repo : "git@github.com:repo.git",
      path : "/var/www/production",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env production"
    }
  }
};
