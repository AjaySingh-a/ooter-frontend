allprojects {
    afterEvaluate {
        // Configure kapt worker JVM args via Gradle worker API
        tasks.withType<org.jetbrains.kotlin.gradle.internal.KaptWithoutKotlincTask>().configureEach {
            val userHome = System.getProperty("user.home")
            val sqlitePath = "$userHome\\.sqlite"
            val tmpDir = "$userHome\\.gradle\\tmp"
            
            // The worker API doesn't directly expose JVM args, but we can use
            // the worker configuration to set system properties
            // Since kapt workers are isolated, we need to configure them at the worker level
            doFirst {
                // These won't help for isolated workers, but set them anyway
                System.setProperty("org.sqlite.lib.path", sqlitePath)
                System.setProperty("java.io.tmpdir", tmpDir)
            }
        }
        
        // Configure Gradle workers to use custom JVM args
        gradle.projectsEvaluated {
            tasks.withType<org.jetbrains.kotlin.gradle.internal.KaptWithoutKotlincTask>().configureEach {
                val userHome = System.getProperty("user.home")
                val sqlitePath = "$userHome\\.sqlite"
                val tmpDir = "$userHome\\.gradle\\tmp"
                
                // Try to configure the worker's JVM through fork options
                // Note: This may not work for all Gradle versions
                try {
                    // Access the worker configuration if available
                    if (this.hasProperty("workerConfiguration")) {
                        def workerConfig = this.workerConfiguration
                        if (workerConfig != null && workerConfig.hasProperty("jvmArgs")) {
                            workerConfig.jvmArgs = [
                                "-Dorg.sqlite.lib.path=$sqlitePath",
                                "-Djava.io.tmpdir=$tmpDir",
                                "-Duser.home=$userHome"
                            ]
                        }
                    }
                } catch (Exception e) {
                    // Worker configuration not available in this Gradle version
                }
            }
        }
    }
}
