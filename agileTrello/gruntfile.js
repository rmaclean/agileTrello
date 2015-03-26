/// <binding Clean='bower, uglify' ProjectOpened='watch, bower, uglify' />
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
                    cleanBowerDir: true,
                }
            }
        },
        less:{
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
            style : {files :["content/site.less"], tasks:["less"]}
        },
    });

    grunt.registerTask("default", ["bower:install"]);

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['watch']);
};