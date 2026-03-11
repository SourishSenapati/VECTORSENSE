cmake_minimum_required(VERSION 3.5)
project(vectorsense_gazebo)

# Directive 2.3: Gazebo Sim (Harmonic) Integration via Ament.
find_package(ament_cmake REQUIRED)

# Force ZeroMQ discovery via PkgConfig
find_package(PkgConfig REQUIRED)
pkg_check_modules(ZMQ REQUIRED libzmq cppzmq)

find_package(gz-sim8 REQUIRED)
find_package(gz-transport13 REQUIRED)
find_package(gz-math7 REQUIRED)
find_package(gz-plugin2 REQUIRED)
find_package(nlohmann_json 3.2.0 REQUIRED)

add_library(GasLeakPlugin SHARED src/GasLeakPlugin.cpp)

# Use target_link_libraries PLAIN signature because ament_target_dependencies uses it
target_include_directories(GasLeakPlugin PRIVATE ${ZMQ_INCLUDE_DIRS})

ament_target_dependencies(GasLeakPlugin
    gz-sim8
    gz-transport13
    gz-math7
    gz-plugin2
    nlohmann_json
)
target_link_libraries(GasLeakPlugin ${ZMQ_LIBRARIES})

install(TARGETS GasLeakPlugin
    DESTINATION lib/${PROJECT_NAME}
)

ament_package()
