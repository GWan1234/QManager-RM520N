"use client";

import React, { useState, useCallback } from "react";

import CustomProfileFormComponent from "@/components/cellular/custom-profiles/custom-profile-form";
import CustomProfileViewComponent from "@/components/cellular/custom-profiles/custom-profile-view";
import { useSimProfiles, type ProfileFormData } from "@/hooks/use-sim-profiles";
import type { SimProfile } from "@/types/sim-profile";

// =============================================================================
// CustomProfileComponent — Page Layout & State Coordinator
// =============================================================================
// Owns the useSimProfiles hook and coordinates between:
//   - Form (left card): create or edit mode
//   - View (right card): list with actions
//
// Edit flow: user clicks Edit in table → getProfile(id) → set editingProfile
//            → form populates → user saves → editingProfile cleared
// =============================================================================

const CustomProfileComponent = () => {
  const {
    profiles,
    activeProfileId,
    isLoading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfile,
    refresh,
  } = useSimProfiles();

  const [editingProfile, setEditingProfile] = useState<SimProfile | null>(null);

  // ---------------------------------------------------------------------------
  // Handle Edit: fetch full profile, switch form to edit mode
  // ---------------------------------------------------------------------------
  const handleEdit = useCallback(
    async (id: string) => {
      const profile = await getProfile(id);
      if (profile) {
        setEditingProfile(profile);
        // Scroll to form on mobile
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [getProfile]
  );

  // ---------------------------------------------------------------------------
  // Handle Save: create or update depending on edit state
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(
    async (data: ProfileFormData): Promise<string | null> => {
      if (editingProfile) {
        const success = await updateProfile(editingProfile.id, data);
        if (success) {
          setEditingProfile(null);
          return editingProfile.id;
        }
        return null;
      } else {
        return await createProfile(data);
      }
    },
    [editingProfile, createProfile, updateProfile]
  );

  // ---------------------------------------------------------------------------
  // Handle Cancel Edit: clear editing state
  // ---------------------------------------------------------------------------
  const handleCancelEdit = useCallback(() => {
    setEditingProfile(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Handle Delete: delegate to hook, returns success boolean
  // ---------------------------------------------------------------------------
  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await deleteProfile(id);
      // If we were editing the deleted profile, clear edit state
      if (success && editingProfile?.id === id) {
        setEditingProfile(null);
      }
      return success;
    },
    [deleteProfile, editingProfile]
  );

  return (
    <div className="@container/main mx-auto p-2">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Custom SIM Profile</h1>
        <p className="text-muted-foreground max-w-5xl">
          Create and manage custom SIM profiles for your cellular device. Each
          profile bundles APN, IMEI, TTL, network mode, and band lock settings
          for one-click application.
        </p>
      </div>
      <div className="grid grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 grid-flow-row gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs">
        <CustomProfileFormComponent
          editingProfile={editingProfile}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
        <CustomProfileViewComponent
          profiles={profiles}
          activeProfileId={activeProfileId}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
};

export default CustomProfileComponent;
