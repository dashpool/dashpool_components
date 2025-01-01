import json
from setuptools import setup, find_packages


with open('dashpool_components/package-info.json') as f:
    package = json.load(f)

package_name = package["name"].replace(" ", "_").replace("-", "_")


with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name=package_name,
    url="https://github.com/dashpool",
    version=package["version"],
    author=package['author'],
    packages=[p for p in find_packages() if p.startswith(package_name)],
    include_package_data=True,
    license=package['license'],
    description=package.get('description', package_name),
    long_description= long_description,
    long_description_content_type="text/markdown",        
    install_requires=[],
    classifiers=[
        'Framework :: Dash',
    ],
)
