// IDE-only stub: gz/transport/Node.hh
#pragma once
#include <string>
#include <functional>

namespace gz {
namespace transport {

class Node {
public:
  template <typename T>
  bool Advertise(const std::string &) { return true; }

  template <typename T>
  bool Subscribe(const std::string &, std::function<void(const T &)>) {
    return true;
  }
};

}  // namespace transport
}  // namespace gz
