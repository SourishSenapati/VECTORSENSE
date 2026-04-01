"""
setup.py — VectorSense NCI-25 Megacomplex Package Configuration.
"""
import os
from glob import glob
from setuptools import find_packages, setup

PACKAGE_NAME = 'vectorsense_megacomplex'

setup(
    name=PACKAGE_NAME,
    version='1.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + PACKAGE_NAME]),
        ('share/' + PACKAGE_NAME, ['package.xml']),
        (os.path.join('share', PACKAGE_NAME, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', PACKAGE_NAME, 'urdf'), glob('urdf/*.xacro')),
        (os.path.join('share', PACKAGE_NAME, 'worlds'), glob('worlds/*.sdf')),
        (os.path.join('share', PACKAGE_NAME, 'meshes'), glob('meshes/*.stl')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Sourish Senapati',
    maintainer_email='sourish@example.com',
    description='NCI-25 Jamnagar Emulation & CUDA Accelerated Simulation',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'black_swan_demo = vectorsense_megacomplex.black_swan_demo:main',
        ],
    },
)
