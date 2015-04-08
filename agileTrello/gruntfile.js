/// <binding Clean='bower, uglify' ProjectOpened='watch' />
module.exports = function (grunt) {
    grunt.initConfig({
        bower: {
            install: {
                options: {
                    targetDir: "./lib",
                    install: true,
                    copy: true,
                    layout: "byType",
                    cleanTargetDir: true,
                    cleanBowerDir: false,
                }
            },
        },
        copy: {
            fonts: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'lib/components-font-awesome/',
                    src: ["*.eot", "*.svg", "*.ttf", "*.woff"],
                    dest: "lib/fonts/"
                }]
            }
        },
        less: {
            all: {
                options: {
                    sourceMap: true,
                    compress: true,
                },
                files: {
                    "content/site.css": "content/site.less"
                }
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                mangle: false,
                compress: true,
            },
            app: {
                dest: 'app/all.min.js',
                src: ['app/**/*.js', "!app/all.min.js"]
            },
            lib: {
                dest: 'lib/all.min.js',
                src: ['lib/angular/angular.js', 'lib/angular-**/**.js', 'lib/moment/moment.js']
            }
        },
        watch: {
            js: { files: ['app/**/*.js', "!app/all.min.js"], tasks: ['uglify:app'] },
            style: { files: ["content/site.less"], tasks: ["less"] },
            bower: { files: ["bower.json"], tasks: ["bower-chain"] },
        },
    });

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch', "bower-chain"]);
    grunt.registerTask("bower-chain", "", function () {
        grunt.task.run('bower:install', 'uglify:lib',"copy:fonts");
    });
};