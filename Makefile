# Copyright (C) 2023-2024 muink <https://github.com/muink>
#
# This is free software, licensed under the MIT License.
# See /LICENSE for more information.
#
include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-netspeedtest

LUCI_TITLE:=LuCI Net Speedtest
LUCI_DEPENDS:=+iperf3 +librespeed-go +python3-speedtest-cli +ca-certificates

LUCI_DESCRIPTION:=Test Net speed

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
