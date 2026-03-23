buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // Utilise la version du plugin Android Gradle déjà présente dans ton projet (regarde dans les commentaires plus bas)
        classpath("com.android.tools.build:gradle:7.3.0")
        // Ajoute le plugin Google Services
        classpath("com.google.gms:google-services:4.4.4")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}