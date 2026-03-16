cmake_minimum_required(VERSION 3.8)
project(vectorsense_gazebo)

# Require C++17 for Gazebo Harmonic (gz-sim8)
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)

# ZeroMQ — available system-wide on Ubuntu 24.04
find_package(PkgConfig REQUIRED)
pkg_check_modules(ZMQ REQUIRED libzmq)

# Gazebo Harmonic (gz-sim8) vendor packages — ROS Jazzy
# These are found via CMAKE_PREFIX_PATH set by /opt/ros/jazzy/setup.bash
find_package(gz-sim8       REQUIRED)
find_package(gz-transport13 REQUIRED)
find_package(gz-math7      REQUIRED)
find_package(gz-plugin2    REQUIRED COMPONENTS register)
find_package(nlohmann_json REQUIRED)

# ── GasLeakPlugin shared library ──────────────────────────────────────────────
add_library(GasLeakPlugin SHARED
  src/GasLeakPlugin.cpp
)

target_include_directories(GasLeakPlugin PRIVATE
  ${ZMQ_INCLUDE_DIRS}
)

target_link_libraries(GasLeakPlugin
  gz-sim8::gz-sim8
  gz-transport13::gz-transport13
  gz-math7::gz-math7
  gz-plugin2::gz-plugin2
  gz-plugin2::register
  nlohmann_json::nlohmann_json
  ${ZMQ_LIBRARIES}
)

# ── Install ───────────────────────────────────────────────────────────────────
install(TARGETS GasLeakPlugin
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY launch worlds
  DESTINATION share/${PROJECT_NAME}
  OPTIONAL
)

ament_package()
