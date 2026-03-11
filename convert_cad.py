"""
Module for converting CAD (SolidWorks) files to STL meshes using FreeCAD.

This module provides an automated pipeline for exporting proprietary
SolidWorks parts and assemblies into a format compatible with
robotic physics simulations (Gazebo/GZ).
"""
import os
import sys

# Standard library and logic
try:
    import FreeCAD
    import Mesh
except ImportError:
    print("Error: FreeCAD modules not found. Ensure FreeCAD is installed.")
    sys.exit(1)

def convert_solidworks_to_stl():
    """
    Main execution loop to find and convert SolidWorks binaries to STL.
    """
    in_dir = (
        "/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/zd975/FYP frame/"
    )
    out_dir = "/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_description/meshes/"

    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    # Filter for supported SolidWorks binary formats
    target_files = [f for f in os.listdir(in_dir) if f.lower().endswith((".sldprt", ".sldasm"))]

    for filename in target_files:
        input_path = os.path.join(in_dir, filename)
        basename = os.path.splitext(filename)[0]
        output_path = os.path.join(out_dir, basename + ".stl")

        print("Processing: " + input_path)
        try:
            doc = FreeCAD.open(input_path)
            objs = doc.Objects
            if objs:
                Mesh.export(objs, output_path)
                print("Exported: " + filename)
            else:
                print("Empty document: " + filename)
            FreeCAD.closeDocument(doc.Name)
        except Exception as error:  # pylint: disable=broad-except
            # Broad exception is necessary due to proprietary CAD kernel unpredictability
            print("Failed: " + filename + " Details: " + str(error))

convert_solidworks_to_stl()
