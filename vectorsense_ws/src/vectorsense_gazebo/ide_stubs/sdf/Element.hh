// IDE-only stub: sdf/Element.hh
#pragma once
#include <memory>
#include <string>

namespace sdf {

class Element {
public:
  template <typename T>
  T Get(const std::string & /*key*/) const { return T{}; }

  bool HasElement(const std::string & /*key*/) const { return false; }

  std::shared_ptr<Element> GetElement(const std::string & /*key*/) const {
    return nullptr;
  }
};

}  // namespace sdf
