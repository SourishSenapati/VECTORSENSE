"""
setup.py for vectorsense_bridge.
"""

from setuptools import find_packages, setup

PACKAGE_NAME = 'vectorsense_bridge'

setup(
    name=PACKAGE_NAME,
    version='1.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + PACKAGE_NAME]),
        ('share/' + PACKAGE_NAME, ['package.xml']),
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
