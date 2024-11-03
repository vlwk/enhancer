import numpy as np
from PIL import Image
import scipy
import matplotlib.pyplot as plt
from skimage import restoration
from sys import argv

NAME = "amogus_preblur"
RADIUS = 23

def convkernel(x, y, sx, sy):
    return 1/(2*np.pi*sx*sy) * np.exp(-((x*x)/(sx*sx)+(y*y)/(sy*sy))/2)

psf = convkernel(np.arange(-60, 60)[:,None], np.arange(-60, 60)[None,:], RADIUS, RADIUS)

img_reloaded2 = np.array(Image.open(NAME + ".tiff"))
img_reloaded2_norm = img_reloaded2 / 2147483647

deconvolved,_ = restoration.unsupervised_wiener(img_reloaded2_norm, psf)

deconvolved = np.maximum(0, deconvolved)
deconvolved = np.minimum(1, deconvolved)
deconvolved_img = np.transpose([deconvolved, deconvolved, deconvolved], axes=[1,2,0])
output_img = Image.fromarray((deconvolved_img*255).astype(np.uint8))
output_img.save(NAME+"_mod.png")
