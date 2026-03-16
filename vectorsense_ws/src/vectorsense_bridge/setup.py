from setuptools import find_packages, setup
import os
from glob import glob

package_name = 'vectorsense_bridge'

setup(
    name=package_name,
    version='1.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Sourish Senapati',
    maintainer_email='sourish@example.com',
    description='ZeroMQ IPC Bridge connecting VectorSense Gazebo to external AI.',
    license='Proprietary',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'gazebo_zmq_bridge = scripts.gazebo_zmq_bridge:main',
            'apf_orchestrator = scripts.apf_orchestrator:main',
            'zmq_telemetry_bridge = scripts.zmq_telemetry_bridge:main',
        ],
    },
)
