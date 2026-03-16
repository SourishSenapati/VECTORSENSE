// IDE-only stub: zmq.hpp (cppzmq C++ bindings)
// Provides just enough to compile GasLeakPlugin.cpp on Windows for IDE analysis.
#pragma once
#include <cstring>
#include <cstddef>
#include <stdexcept>
#include <string>

#define ZMQ_PUB  1
#define ZMQ_SUB  2
#define ZMQ_PUSH 8
#define ZMQ_PULL 7

namespace zmq {

enum class send_flags : int { none = 0, dontwait = 4, sndmore = 2 };
enum class recv_flags : int { none = 0, dontwait = 1 };

class error_t : public std::runtime_error {
public:
  explicit error_t(int /*code*/ = 0) : std::runtime_error("zmq error") {}
};

class message_t {
public:
  explicit message_t(std::size_t sz = 0) : _size(sz), _data(new char[sz ? sz : 1]{}) {}
  ~message_t() { delete[] _data; }

  message_t(const message_t &) = delete;
  message_t & operator=(const message_t &) = delete;

  void *       data()       noexcept { return _data; }
  const void * data() const noexcept { return _data; }
  std::size_t  size() const noexcept { return _size; }

private:
  std::size_t _size;
  char *      _data;
};

class context_t {
public:
  explicit context_t(int /*io_threads*/ = 1) {}
  ~context_t() {}
  context_t(const context_t &) = delete;
  context_t & operator=(const context_t &) = delete;
};

class socket_t {
public:
  socket_t(context_t & /*ctx*/, int /*type*/) {}
  ~socket_t() {}
  socket_t(const socket_t &) = delete;
  socket_t & operator=(const socket_t &) = delete;

  void bind(const std::string & /*addr*/) {}
  void connect(const std::string & /*addr*/) {}
  void setsockopt(int /*opt*/, const void * /*val*/, std::size_t /*sz*/) {}
  void setsockopt_string(int /*opt*/, const std::string & /*val*/) {}

  bool send(message_t & /*msg*/, send_flags /*flags*/ = send_flags::none) { return true; }
  bool recv(message_t & /*msg*/, recv_flags /*flags*/ = recv_flags::none) { return true; }
};

}  // namespace zmq
