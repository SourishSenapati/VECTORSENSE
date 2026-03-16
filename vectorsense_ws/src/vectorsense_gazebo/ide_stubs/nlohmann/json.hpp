// IDE-only stub: nlohmann/json.hpp
// Covers the subset of the API used in GasLeakPlugin.cpp.
#pragma once
#include <initializer_list>
#include <string>

namespace nlohmann {

class json {
public:
  json() = default;

  // Construct from initializer list (e.g. {x, y, z})
  json(std::initializer_list<json> /*il*/) {}
  json(std::initializer_list<double> /*il*/) {}

  // json["key"] returns a proxy that accepts any assignment
  json & operator[](const std::string & /*key*/) {
    return *this;
  }
  const json & operator[](const std::string & /*key*/) const {
    return *this;
  }

  // Assignment from scalar types
  template <typename T>
  json & operator=(T && /*val*/) { return *this; }

  // Assignment from initializer_list<double> — covers {x, y, z} syntax
  json & operator=(std::initializer_list<double> /*il*/) { return *this; }
  json & operator=(std::initializer_list<json> /*il*/)   { return *this; }

  std::string dump(int /*indent*/ = -1) const { return "{}"; }

  template <typename T>
  static json parse(T && /*input*/) { return json{}; }

  template <typename T>
  T get() const { return T{}; }
};

}  // namespace nlohmann
