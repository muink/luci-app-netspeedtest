# SPDX-License-Identifier: MIT
#
# Copyright (C) 2023-2025 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-netspeedtest

LUCI_TITLE:=LuCI Net Speedtest
LUCI_DEPENDS:=+iperf3 +librespeed-go +ca-certificates +curl

LUCI_DESCRIPTION:=Test Net speed

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=MIT

PKG_UNPACK=$(CURDIR)/.prepare.sh $(PKG_NAME) $(CURDIR) $(PKG_BUILD_DIR)

define Package/$(LUCI_NAME)/conffiles
/etc/config/netspeedtest
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
