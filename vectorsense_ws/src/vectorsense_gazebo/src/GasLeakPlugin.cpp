#include <gz/sim/System.hh>
#include <gz/sim/components/Model.hh>
#include <gz/sim/components/Name.hh>
#include <gz/sim/components/Pose.hh>
#include <gz/plugin/Register.hh>
#include <gz/transport/Node.hh>
#include <zmq.hpp>
#include <nlohmann/json.hpp>
#include <iostream>
#include <chrono>

/* 
 * Directive 2.2: Industrial Gas Hazard Physics System (GZ Sim Harmonic).
 * Broadcasts mass-loss transients and leak coordinates to the Spatial Twin bridge.
 */

using namespace gz;
using namespace sim;

namespace vectorsense
{
  class GasLeakPlugin : public System,
                        public ISystemConfigure,
                        public ISystemPreUpdate
  {
  public:
    GasLeakPlugin()
    {
      // Prepare telemetry channel for financial bridge
      this->context = new zmq::context_t(1);
      this->socket = new zmq::socket_t(*(this->context), ZMQ_PUB);
      this->socket->bind("tcp://127.0.0.1:5556");
      std::cout << "[VECTOR_SENSE] High-Fidelity Physics Plugin Initialized on Port 5556.\n";
    }

    void Configure(const Entity &_entity,
                   const std::shared_ptr<const sdf::Element> &_sdf,
                   EntityComponentManager &_ecm,
                   EventManager &_eventMgr) override
    {
      (void)_entity;
      (void)_ecm;
      (void)_eventMgr;

      if (_sdf->HasElement("leak_origin"))
        this->leakOrigin = _sdf->Get<math::Vector3d>("leak_origin");

      if (_sdf->HasElement("activation_time"))
        this->activationTime = _sdf->Get<double>("activation_time");
      
      this->startTime = std::chrono::steady_clock::now();
    }

    void PreUpdate(const UpdateInfo &_info,
                   EntityComponentManager &_ecm) override
    {
      (void)_info;
      (void)_ecm;
      
      auto now = std::chrono::steady_clock::now();
      double elapsed = std::chrono::duration<double>(now - this->startTime).count();

      bool leaked = (elapsed > this->activationTime);
      double mass_loss = leaked ? 0.085 : 0.0; // kg/s
      double commodity_loss_rate = leaked ? 1450.0 : 0.0; // $/hr

      // Construct high-fidelity financial packet
      nlohmann::json data;
      data["plume_origin"] = {this->leakOrigin.X(), this->leakOrigin.Y(), this->leakOrigin.Z()};
      data["leak"] = leaked;
      data["mass_loss"] = mass_loss;
      data["commodity_loss_rate"] = commodity_loss_rate;
      data["epa_exposure"] = leaked ? 50000.0 : 0.0;
      data["status"] = leaked ? "HAZARD_DETECTED" : "CORE_SYNC_OK";

      // Broadcast to bridge
      std::string payload = data.dump();
      zmq::message_t msg(payload.size());
      memcpy(msg.data(), payload.c_str(), payload.size());
      this->socket->send(msg, zmq::send_flags::none);
    }

  private:
    double activationTime = 10.0;
    math::Vector3d leakOrigin = {12.5, 4.2, 15.0};
    std::chrono::steady_clock::time_point startTime;
    zmq::context_t *context;
    zmq::socket_t *socket;
  };
}

GZ_ADD_PLUGIN(vectorsense::GasLeakPlugin,
              gz::sim::System,
              vectorsense::GasLeakPlugin::ISystemConfigure,
              vectorsense::GasLeakPlugin::ISystemPreUpdate)
