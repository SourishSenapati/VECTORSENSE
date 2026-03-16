// IDE-only stub: gz/sim/System.hh
// Used only by clangd on Windows. The real header is in the WSL ROS Jazzy installation.
// This file is excluded from colcon builds via .colconignore in ide_stubs/.
#pragma once
#include <cstdint>
#include <memory>
#include <string>

// Forward-declare sdf::Element so System.hh consumers compile
namespace sdf { class Element; }

namespace gz {
namespace sim {

using Entity = uint64_t;

class EntityComponentManager {};
class EventManager {};
struct UpdateInfo {
  bool paused{false};
  uint64_t iterations{0};
};

class System {};

struct ISystemConfigure {
  virtual void Configure(
      const Entity &,
      const std::shared_ptr<const sdf::Element> &,
      EntityComponentManager &,
      EventManager &) = 0;
  virtual ~ISystemConfigure() = default;
};

struct ISystemPreUpdate {
  virtual void PreUpdate(const UpdateInfo &, EntityComponentManager &) = 0;
  virtual ~ISystemPreUpdate() = default;
};

struct ISystemUpdate {
  virtual void Update(const UpdateInfo &, EntityComponentManager &) = 0;
  virtual ~ISystemUpdate() = default;
};

struct ISystemPostUpdate {
  virtual void PostUpdate(const UpdateInfo &, EntityComponentManager &) = 0;
  virtual ~ISystemPostUpdate() = default;
};

}  // namespace sim
}  // namespace gz
