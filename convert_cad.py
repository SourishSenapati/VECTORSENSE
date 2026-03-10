"""
Module for converting CAD (SolidWorks) files to STL meshes using FreeCAD.
"""
import os
import sys

# We do not use f-strings or complex syntax if it is failing
# We use standard string concatenation
try:
    import FreeCAD
    import Mesh
except ImportError:
    print("Could not import FreeCAD/Mesh")
    sys.exit(1)

def convert():
    """
    Scans the source directory for .sldprt and .sldasm files and converts
    them to .stl in the output directory.
    """
    in_dir = "/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/zd975/FYP frame/"
    out_dir = "/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_description/meshes/"

    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    for f in os.listdir(in_dir):
        if f.lower().endswith(".sldprt") or f.lower().endswith(".sldasm"):
            input_path = os.path.join(in_dir, f)
            basename = os.path.splitext(f)[0]
            output_path = os.path.join(out_dir, basename + ".stl")

            print("Converting " + input_path + " -> " + output_path)
            try:
                doc = FreeCAD.open(input_path)
                objs = doc.Objects
                if len(objs) > 0:
                    Mesh.export(objs, output_path)
                    print("DONE: " + f)
                else:
                    print("EMPTY MESH: " + f)
                FreeCAD.closeDocument(doc.Name)
            except Exception as e: # pylint: disable=broad-except
                print("FAILED " + f + ": " + str(e))

convert()

