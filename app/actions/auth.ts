"use server";

import { cookies } from "next/headers";
import { prisma } from "@/db/prisma";
import { hashPassword, comparePasswords } from "@/lib/auth";

export async function signupUser(username: string, password: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function loginUser(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const passwordValid = await comparePasswords(password, user.password);
    if (!passwordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // Return the cookie to be set in the client
    return { 
      success: true, 
      userId: user.id,
      cookie: {
        name: "session",
        value: user.id,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60, // 1 week in seconds
          path: "/",
          sameSite: "lax"
        }
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Failed to login" };
  }
}
export async function getUserFromSession() {
  try {
    const StoreCookie = await cookies();
    const sessionId = StoreCookie.get("session")?.value;

    if (!sessionId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true, username: true },
    });

    return user;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

export async function logoutUser() {
  const StoreCookie = await cookies();
  StoreCookie.delete("session");
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session")?.value;
  console.log(userId);

  if (!userId) {
    return null;
  }

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,  // Including name
        bio: true,   // Including bio
      },
    });

    return current;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function setupUserProfile({
  name,
  email,
  bio,
  avatarUrl,
}: {
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session")?.value;

    if (!userId) {
      return { success: false, error: "User not logged in" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        bio,
        avatarUrl,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Profile setup error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
