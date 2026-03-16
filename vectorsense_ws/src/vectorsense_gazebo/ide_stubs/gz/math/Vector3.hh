// IDE-only stub: gz/math/Vector3.hh
#pragma once

namespace gz {
namespace math {

template <typename T>
class Vector3
{
public:
  Vector3() : _x(0), _y(0), _z(0) {}
  Vector3(T x, T y, T z) : _x(x), _y(y), _z(z) {}

  T X() const { return _x; }
  T Y() const { return _y; }
  T Z() const { return _z; }

  void X(T v) { _x = v; }
  void Y(T v) { _y = v; }
  void Z(T v) { _z = v; }

private:
  T _x, _y, _z;
};

using Vector3d = Vector3<double>;
using Vector3f = Vector3<float>;

}  // namespace math
}  // namespace gz
